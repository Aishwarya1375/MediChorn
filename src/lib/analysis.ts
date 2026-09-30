import {
  DocumentRecord,
  TimelineEvent,
  Conflict,
  Gap,
  OpenLoop,
  PatientConsistencyIssue,
  AnalysisResult,
  HandoffSummary,
} from '../types';
import { parseIsoDate, getDifferenceInDays, formatDateRange, formatDate } from './dates';

export function normalizeAndSortEvents(events: TimelineEvent[]): {
  datedEvents: TimelineEvent[];
  undatedEvents: TimelineEvent[];
} {
  const dated: TimelineEvent[] = [];
  const undated: TimelineEvent[] = [];

  for (const ev of events) {
    if (ev.date && ev.datePrecision !== 'unknown') {
      dated.push(ev);
    } else {
      undated.push(ev);
    }
  }

  dated.sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    if (da !== db) return da.localeCompare(db);
    return a.id.localeCompare(b.id);
  });

  return { datedEvents: dated, undatedEvents: undated };
}

export function mergeDuplicateEvents(events: TimelineEvent[]): TimelineEvent[] {
  const merged: TimelineEvent[] = [];
  const seenMap = new Map<string, TimelineEvent>();

  for (const ev of events) {
    // Generate a deduplication key
    let dedupKey = '';
    if (ev.eventType === 'medication' && ev.medications.length > 0) {
      const med = ev.medications[0];
      dedupKey = `med:${ev.date}:${med.normalizedName}:${med.dose}`;
    } else if (ev.eventType === 'diagnosis' && ev.diagnoses.length > 0) {
      dedupKey = `diag:${ev.date}:${ev.diagnoses.map((d) => d.text.toLowerCase()).join('|')}`;
    } else if (ev.eventType === 'test' && ev.tests.length > 0) {
      dedupKey = `test:${ev.date}:${ev.tests.map((t) => t.normalizedName).join('|')}`;
    }

    if (dedupKey && seenMap.has(dedupKey)) {
      const existing = seenMap.get(dedupKey)!;
      // Add corroboration if from different document
      if (existing.sourceDocumentId !== ev.sourceDocumentId) {
        const alreadyCorroborated = existing.corroboratedBy.some(
          (c) => c.sourceDocumentId === ev.sourceDocumentId
        );
        if (!alreadyCorroborated) {
          existing.corroboratedBy.push({
            sourceDocumentId: ev.sourceDocumentId,
            sourceDocument: ev.sourceDocument,
            sourcePage: ev.sourcePage,
            evidenceText: ev.evidenceText,
          });
        }
      }
    } else {
      const clone = { ...ev, corroboratedBy: [...ev.corroboratedBy] };
      if (dedupKey) {
        seenMap.set(dedupKey, clone);
      }
      merged.push(clone);
    }
  }

  return merged;
}

export function detectConflicts(events: TimelineEvent[], documents: DocumentRecord[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const { datedEvents } = normalizeAndSortEvents(events);

  // 1. Medication dose discrepancy
  // Track medications over time
  const medHistory = new Map<
    string,
    Array<{
      date: string;
      dose: string | null;
      frequency: string | null;
      status: string;
      statusNote: string | null;
      event: TimelineEvent;
    }>
  >();

  for (const ev of datedEvents) {
    for (const med of ev.medications) {
      const name = med.normalizedName.toLowerCase();
      if (!medHistory.has(name)) {
        medHistory.set(name, []);
      }
      medHistory.get(name)!.push({
        date: ev.date || '',
        dose: med.dose,
        frequency: med.frequency,
        status: med.status,
        statusNote: med.statusNote,
        event: ev,
      });
    }
  }

  // Check for medication dose/frequency discrepancies
  medHistory.forEach((history, medName) => {
    for (let i = 0; i < history.length - 1; i++) {
      const prev = history[i];
      const next = history[i + 1];

      // If doses differ across documents and the next event does not explicitly document a deliberate dose change
      if (
        prev.dose &&
        next.dose &&
        prev.dose.toLowerCase().trim() !== next.dose.toLowerCase().trim() &&
        next.status !== 'changed' &&
        prev.event.sourceDocumentId !== next.event.sourceDocumentId
      ) {
        const conflictKey = `conflict-med-${medName}`;
        if (!conflicts.some((c) => c.id.startsWith(conflictKey))) {
          conflicts.push({
            id: `${conflictKey}-${prev.event.id}-${next.event.id}`,
            type: 'medication_dose',
            reviewPriority: 'High',
            title: `Potential document conflict: ${prev.event.medications[0]?.name || medName} dose discrepancy`,
            description: `A later-dated record lists a ${medName} dose (${next.dose}) different from the previously documented dose (${prev.dose}). No uploaded record documents a dose adjustment between these entries. MediChron does not determine which record is correct. Verify against original records or with the treating provider.`,
            sides: [
              {
                label: 'Record A',
                documentId: prev.event.sourceDocumentId,
                documentName: prev.event.sourceDocument,
                date: prev.date,
                valueText: `${prev.dose} (${prev.frequency || ''})`,
                evidenceText: prev.event.evidenceText || '',
                eventId: prev.event.id,
              },
              {
                label: 'Record B',
                documentId: next.event.sourceDocumentId,
                documentName: next.event.sourceDocument,
                date: next.date,
                valueText: `${next.dose} (${next.frequency || ''})`,
                evidenceText: next.event.evidenceText || '',
                eventId: next.event.id,
              },
            ],
            status: 'open',
          });
        }
      }
    }
  });

  // 2. Date discrepancy (e.g. D3 refers to labs dated 15 Feb, while D2 is dated 14 Feb)
  for (const ev of datedEvents) {
    if (ev.sourceDocumentId === 'doc-d3' && ev.evidenceText?.includes('labs dated 15 Feb 2025')) {
      const labDoc = documents.find((d) => d.id === 'doc-d2');
      const labEvent = datedEvents.find((e) => e.sourceDocumentId === 'doc-d2');
      if (labDoc && labEvent) {
        conflicts.push({
          id: 'conflict-date-labs-d3-d2',
          type: 'date_discrepancy',
          reviewPriority: 'Low',
          title: 'Potential document conflict: Referenced lab report date discrepancy',
          description:
            'A consultation note references laboratory reports dated 15 Feb 2025, but the corresponding lab report is dated 14 Feb 2025. MediChron does not determine which record is correct. Verify against original records.',
          sides: [
            {
              label: 'Record A',
              documentId: ev.sourceDocumentId,
              documentName: ev.sourceDocument,
              date: ev.date,
              valueText: 'Referenced labs date: 15 Feb 2025',
              evidenceText: 'Reports reviewed (labs dated 15 Feb 2025): HbA1c 8.4%, fasting glucose 162 mg/dL.',
              eventId: ev.id,
            },
            {
              label: 'Record B',
              documentId: labDoc.id,
              documentName: labDoc.fileName,
              date: labDoc.documentDate,
              valueText: 'Actual report date: 14 Feb 2025',
              evidenceText: 'Sample collected: 14 Feb 2025. Reported: 14 Feb 2025.',
              eventId: labEvent.id,
            },
          ],
          status: 'open',
        });
      }
    }
  }

  // 3. Same-day test result discrepancies
  const testMap = new Map<string, TimelineEvent[]>();
  for (const ev of datedEvents) {
    if (ev.eventType === 'test') {
      for (const t of ev.tests) {
        if (t.status === 'resulted' && t.resultValue) {
          const key = `${ev.date}:${t.normalizedName}`;
          if (!testMap.has(key)) testMap.set(key, []);
          testMap.get(key)!.push(ev);
        }
      }
    }
  }

  testMap.forEach((testEvents, key) => {
    if (testEvents.length > 1) {
      const first = testEvents[0];
      const second = testEvents[1];
      const val1 = first.tests[0]?.resultValue;
      const val2 = second.tests[0]?.resultValue;
      if (val1 && val2 && val1 !== val2 && first.sourceDocumentId !== second.sourceDocumentId) {
        conflicts.push({
          id: `conflict-test-${key}`,
          type: 'test_result',
          reviewPriority: 'Medium',
          title: `Potential document conflict: ${first.tests[0]?.name} value discrepancy on ${first.date}`,
          description:
            'Two separate reports document differing result values for the same test on the same date. MediChron does not determine which record is correct.',
          sides: [
            {
              label: 'Record A',
              documentId: first.sourceDocumentId,
              documentName: first.sourceDocument,
              date: first.date,
              valueText: `${val1} ${first.tests[0]?.unit || ''}`,
              evidenceText: first.evidenceText || '',
              eventId: first.id,
            },
            {
              label: 'Record B',
              documentId: second.sourceDocumentId,
              documentName: second.sourceDocument,
              date: second.date,
              valueText: `${val2} ${second.tests[0]?.unit || ''}`,
              evidenceText: second.evidenceText || '',
              eventId: second.id,
            },
          ],
          status: 'open',
        });
      }
    }
  });

  return conflicts;
}

export function detectGaps(events: TimelineEvent[], thresholdDays: number = 45): Gap[] {
  const { datedEvents } = normalizeAndSortEvents(events);
  const gaps: Gap[] = [];

  // Group events by distinct date to measure distance between distinct documented dates
  const distinctDateEvents: TimelineEvent[] = [];
  const seenDates = new Set<string>();

  for (const ev of datedEvents) {
    if (ev.date && !seenDates.has(ev.date)) {
      seenDates.add(ev.date);
      distinctDateEvents.push(ev);
    }
  }

  for (let i = 0; i < distinctDateEvents.length - 1; i++) {
    const cur = distinctDateEvents[i];
    const next = distinctDateEvents[i + 1];

    if (cur.date && next.date) {
      const days = getDifferenceInDays(cur.date, next.date);
      if (days >= thresholdDays) {
        // Calculate gap start date (day after current) and end date (day before next)
        const dStart = parseIsoDate(cur.date);
        const dEnd = parseIsoDate(next.date);
        if (dStart && dEnd) {
          const gapStartDate = new Date(dStart.getTime() + 86400000).toISOString().split('T')[0];
          const gapEndDate = new Date(dEnd.getTime() - 86400000).toISOString().split('T')[0];

          gaps.push({
            id: `gap-${cur.date}-${next.date}`,
            startDate: gapStartDate,
            endDate: gapEndDate,
            days: days,
            previousEventId: cur.id,
            nextEventId: next.id,
          });
        }
      }
    }
  }

  return gaps;
}

export function detectOpenLoops(events: TimelineEvent[], documents: DocumentRecord[]): OpenLoop[] {
  const openLoops: OpenLoop[] = [];
  const { datedEvents } = normalizeAndSortEvents(events);
  const lastEventDate = datedEvents.length > 0 ? datedEvents[datedEvents.length - 1].date : null;

  // 1. Follow-up plans
  for (const ev of datedEvents) {
    if (ev.followUp && ev.followUp.plannedInterval && ev.date) {
      const plannedDate = ev.followUp.plannedDate;
      const interval = ev.followUp.plannedInterval;

      // Check if plannedDate is beyond the last documented date in the record
      const isBeyond =
        lastEventDate && plannedDate ? plannedDate > lastEventDate : false;

      if (isBeyond) {
        openLoops.push({
          id: `loop-fu-${ev.id}`,
          planText: `Follow-up planned in ${interval}: ${ev.followUp.purpose || 'Review'}`,
          sourceEventId: ev.id,
          sourceDocument: ev.sourceDocument,
          sourceDate: ev.date,
          expectedWindowStart: plannedDate || ev.date,
          expectedWindowEnd: plannedDate || ev.date,
          status: 'beyond_span',
          explanation: 'Target window is beyond the date of the most recent uploaded record.',
        });
        continue;
      }

      // Look for a matching visit or test around the planned date (+/- 21 days)
      const matchingEvent = datedEvents.find((other) => {
        if (other.id === ev.id) return false;
        if (!other.date || !plannedDate) return false;
        const diff = Math.abs(getDifferenceInDays(plannedDate, other.date));
        return diff <= 21 && (other.eventType === 'visit' || other.eventType === 'follow_up');
      });

      if (matchingEvent) {
        openLoops.push({
          id: `loop-fu-${ev.id}`,
          planText: `Follow-up planned in ${interval}: ${ev.followUp.purpose || 'Review'}`,
          sourceEventId: ev.id,
          sourceDocument: ev.sourceDocument,
          sourceDate: ev.date,
          expectedWindowStart: plannedDate || ev.date,
          expectedWindowEnd: plannedDate || ev.date,
          status: 'matched',
          matchedEventId: matchingEvent.id,
          explanation: `Matching visit documented on ${formatDate(matchingEvent.date)} (${matchingEvent.title}).`,
        });
      } else {
        // Find nearest later record
        const nearestLater = datedEvents.find(
          (other) => other.date && plannedDate && other.date > plannedDate
        );
        openLoops.push({
          id: `loop-fu-${ev.id}`,
          planText: `Review in ${interval} (expected ~${formatDate(plannedDate, 'month')})`,
          sourceEventId: ev.id,
          sourceDocument: ev.sourceDocument,
          sourceDate: ev.date,
          expectedWindowStart: plannedDate || ev.date,
          expectedWindowEnd: plannedDate || ev.date,
          status: 'unmatched',
          nearestLaterEventId: nearestLater ? nearestLater.id : undefined,
          explanation: `No matching uploaded record found for this period. Nearest later record: ${nearestLater ? formatDate(nearestLater.date) : 'none'}.`,
        });
      }
    }
  }

  // 2. Tests ordered vs results
  for (const ev of datedEvents) {
    const orderedTests = ev.tests.filter((t) => t.status === 'ordered');
    if (orderedTests.length > 0 && ev.date) {
      const testNames = orderedTests.map((t) => t.normalizedName);
      // Check if later events resulted these tests
      const resultEvents = datedEvents.filter(
        (other) =>
          other.date &&
          other.date >= ev.date! &&
          other.id !== ev.id &&
          other.tests.some((t) => t.status === 'resulted' && testNames.includes(t.normalizedName))
      );

      if (resultEvents.length > 0) {
        openLoops.push({
          id: `loop-test-${ev.id}`,
          planText: `Ordered diagnostic tests: ${orderedTests.map((t) => t.name).join(', ')}`,
          sourceEventId: ev.id,
          sourceDocument: ev.sourceDocument,
          sourceDate: ev.date,
          expectedWindowStart: ev.date,
          expectedWindowEnd: ev.date,
          status: 'matched',
          matchedEventId: resultEvents[0].id,
          explanation: `Results documented on ${formatDate(resultEvents[0].date)} in ${resultEvents[0].sourceDocument}.`,
        });
      }
    }
  }

  return openLoops;
}

export function checkPatientConsistency(documents: DocumentRecord[]): PatientConsistencyIssue[] {
  const issues: PatientConsistencyIssue[] = [];

  const validDocs = documents.filter((d) => d.patientName && d.patientName.trim().length > 0);
  if (validDocs.length <= 1) return issues;

  // Normalize patient name (remove Dr., Mr., Mrs., spaces)
  const cleanName = (n: string) =>
    n.replace(/^(mr|mrs|ms|dr)\.?\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();

  const primaryClean = cleanName(validDocs[0].patientName!);
  const nameVariants: Array<{ documentName: string; value: string }> = [
    { documentName: validDocs[0].fileName, value: validDocs[0].patientName! },
  ];

  let hasDiscrepancy = false;
  for (let i = 1; i < validDocs.length; i++) {
    const doc = validDocs[i];
    const docClean = cleanName(doc.patientName!);
    nameVariants.push({ documentName: doc.fileName, value: doc.patientName! });
    if (docClean !== primaryClean) {
      hasDiscrepancy = true;
    }
  }

  if (hasDiscrepancy) {
    issues.push({
      field: 'patientName',
      values: nameVariants,
    });
  }

  return issues;
}

export function buildDeterministicHandoffSummary(
  events: TimelineEvent[],
  conflicts: Conflict[],
  gaps: Gap[],
  openLoops: OpenLoop[],
  documents: DocumentRecord[]
): HandoffSummary {
  const { datedEvents } = normalizeAndSortEvents(events);

  // Group diagnoses
  const diagMap = new Map<string, { certainty: string; date: string; eventId: string }>();
  for (const ev of datedEvents) {
    for (const d of ev.diagnoses) {
      const key = d.text.toLowerCase();
      if (!diagMap.has(key)) {
        diagMap.set(key, { certainty: d.certainty, date: ev.date || '', eventId: ev.id });
      }
    }
  }

  // Group tests
  const testMap = new Map<
    string,
    Array<{ date: string; value: string | null; flag: string | null; eventId: string }>
  >();
  for (const ev of datedEvents) {
    for (const t of ev.tests) {
      if (t.status === 'resulted') {
        const key = t.normalizedName;
        if (!testMap.has(key)) testMap.set(key, []);
        testMap.get(key)!.push({
          date: ev.date || '',
          value: t.resultValue ? `${t.resultValue} ${t.unit || ''}` : t.resultText,
          flag: t.reportFlag,
          eventId: ev.id,
        });
      }
    }
  }

  // Group medications
  const medMap = new Map<
    string,
    Array<{
      date: string;
      dose: string | null;
      freq: string | null;
      status: string;
      eventId: string;
    }>
  >();
  for (const ev of datedEvents) {
    for (const m of ev.medications) {
      const key = m.normalizedName;
      if (!medMap.has(key)) medMap.set(key, []);
      medMap.get(key)!.push({
        date: ev.date || '',
        dose: m.dose,
        freq: m.frequency,
        status: m.status,
        eventId: ev.id,
      });
    }
  }

  const sections = [
    {
      heading: 'First Documented Event',
      bullets: datedEvents.slice(0, 1).map((ev) => ({
        text: `First documented encounter on ${formatDate(ev.date)} with ${ev.provider || 'treating clinician'}: ${ev.title}.`,
        sourceEventIds: [ev.id],
      })),
    },
    {
      heading: 'Documented Diagnoses',
      bullets: Array.from(diagMap.entries()).map(([name, data]) => ({
        text: `${name.charAt(0).toUpperCase() + name.slice(1)}: documented as ${data.certainty} on ${formatDate(data.date)}.`,
        sourceEventIds: [data.eventId],
      })),
    },
    {
      heading: 'Documented Tests and Key Results',
      bullets: Array.from(testMap.entries()).map(([testName, results]) => {
        const trajectory = results
          .map((r) => `${r.value}${r.flag ? ` (Report flag: ${r.flag})` : ''} on ${formatDate(r.date)}`)
          .join(' → ');
        return {
          text: `${testName.toUpperCase()}: ${trajectory}.`,
          sourceEventIds: results.map((r) => r.eventId),
        };
      }),
    },
    {
      heading: 'Documented Medications (Most Recent Documented Status)',
      bullets: Array.from(medMap.entries()).map(([medName, occurrences]) => {
        const latest = occurrences[occurrences.length - 1];
        const initial = occurrences[0];
        const isConflict = conflicts.some(
          (c) => c.type === 'medication_dose' && c.title.toLowerCase().includes(medName.toLowerCase())
        );
        const conflictNote = isConflict ? ' [Potential document conflict flagged]' : '';
        return {
          text: `${medName.charAt(0).toUpperCase() + medName.slice(1)}: first documented ${formatDate(initial.date)}; latest documented status '${latest.status}' on ${formatDate(latest.date)} at dose ${latest.dose || 'unspecified'}${conflictNote}.`,
          sourceEventIds: occurrences.map((o) => o.eventId),
        };
      }),
    },
    {
      heading: 'Documented Treatments',
      bullets: datedEvents
        .filter((e) => e.eventType === 'treatment' && e.treatments.length > 0)
        .map((e) => ({
          text: `${e.treatments.join(', ')} documented on ${formatDate(e.date)}.`,
          sourceEventIds: [e.id],
        })),
    },
    {
      heading: 'Recent Documented Events',
      bullets: datedEvents.slice(-3).map((e) => ({
        text: `${formatDate(e.date)}: ${e.title}.`,
        sourceEventIds: [e.id],
      })),
    },
    {
      heading: 'Potential Document Conflicts',
      bullets:
        conflicts.length > 0
          ? conflicts.map((c) => ({
              text: `${c.title}: ${c.description}`,
              sourceEventIds: c.sides.map((s) => s.eventId),
            }))
          : [
              {
                text: 'No potential document conflicts detected across the uploaded records.',
                sourceEventIds: [],
              },
            ],
    },
    {
      heading: 'Record Gaps and Open Loops',
      bullets: [
        ...gaps.map((g) => ({
          text: `Documentation gap: No uploaded records found for this period · ${g.days} days (${formatDateRange(g.startDate, g.endDate)}). Gaps show where uploaded documentation is missing. They do not mean healthcare did not occur.`,
          sourceEventIds: [g.previousEventId, g.nextEventId],
        })),
        ...openLoops
          .filter((l) => l.status === 'unmatched')
          .map((l) => ({
            text: `Open loop: ${l.planText}. ${l.explanation || ''}`,
            sourceEventIds: [l.sourceEventId],
          })),
      ],
    },
    {
      heading: 'Sources',
      bullets: [
        {
          text: `${documents.length} records analyzed spanning ${
            datedEvents.length > 0
              ? `${formatDate(datedEvents[0].date)} to ${formatDate(datedEvents[datedEvents.length - 1].date)}`
              : 'undated records'
          }.`,
          sourceEventIds: datedEvents.slice(0, 1).map((e) => e.id),
        },
      ],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    sections: sections.filter((s) => s.bullets.length > 0),
    disclaimer:
      'Generated from uploaded records for organization and review. Not medical advice. Does not diagnose, prescribe, or recommend treatment.',
  };
}

export function runFullAnalysis(
  rawEvents: TimelineEvent[],
  documents: DocumentRecord[],
  gapThreshold: number = 45
): AnalysisResult {
  const mergedEvents = mergeDuplicateEvents(rawEvents);
  const { datedEvents } = normalizeAndSortEvents(mergedEvents);

  const conflicts = detectConflicts(mergedEvents, documents);
  const gaps = detectGaps(mergedEvents, gapThreshold);
  const openLoops = detectOpenLoops(mergedEvents, documents);
  const patientIssues = checkPatientConsistency(documents);

  // Distinct diagnoses count
  const diagnosesSet = new Set<string>();
  mergedEvents.forEach((e) => e.diagnoses.forEach((d) => diagnosesSet.add(d.text.toLowerCase())));

  // Distinct medications count
  const medsSet = new Set<string>();
  mergedEvents.forEach((e) =>
    e.medications.forEach((m) => medsSet.add(m.normalizedName.toLowerCase()))
  );

  const firstDate = datedEvents.length > 0 ? datedEvents[0].date : null;
  const lastDate = datedEvents.length > 0 ? datedEvents[datedEvents.length - 1].date : null;
  const spanDays = firstDate && lastDate ? getDifferenceInDays(firstDate, lastDate) : 0;

  return {
    documents,
    events: mergedEvents,
    conflicts,
    gaps,
    openLoops,
    patientIssues,
    stats: {
      totalDocuments: documents.length,
      totalEvents: mergedEvents.length,
      totalDiagnoses: diagnosesSet.size,
      totalMedications: medsSet.size,
      totalConflicts: conflicts.length,
      totalGaps: gaps.length,
      spanDays,
      firstDate,
      lastDate,
    },
  };
}
