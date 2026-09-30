import jsPDF from 'jspdf';
import {
  AnalysisResult,
  DocumentRecord,
  TimelineEvent,
  Conflict,
  Gap,
  HandoffSummary,
  UserProfile,
} from '../types';
import { formatDate } from './dates';

export interface GeneratePdfOptions {
  patientInfo: { name: string; ageOrDob: string; id: string; email?: string };
  isDemoMode: boolean;
  currentUser: UserProfile | null;
  documents: DocumentRecord[];
  events: TimelineEvent[];
  conflicts: Conflict[];
  gaps: Gap[];
  stats: AnalysisResult['stats'];
  handoffSummary: HandoffSummary;
  skipAutoDownload?: boolean;
}

export interface GeneratedPdfResult {
  fileName: string;
  base64Data: string;
  doc: jsPDF;
  download: () => void;
}

export function generateHandoffPdf(options: GeneratePdfOptions): GeneratedPdfResult {
  const {
    patientInfo,
    isDemoMode,
    documents,
    events,
    conflicts,
    gaps,
    stats,
    handoffSummary,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 48;
  const marginBottom = 48;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;

  // Professional Healthcare Palette (RGB)
  const colorTealDark = [15, 118, 110]; // #0f766e
  const colorTealLight = [204, 251, 241]; // #ccfbf1
  const colorTealBg = [240, 253, 250]; // #f0fdfa
  const colorSlateDark = [15, 23, 42]; // #0f172a
  const colorSlateText = [51, 65, 85]; // #334155
  const colorSlateMuted = [100, 116, 139]; // #64748b
  const colorSlateBorder = [226, 232, 240]; // #e2e8f0
  const colorSlateLight = [248, 250, 252]; // #f8fafc
  const colorAmberDark = [180, 83, 9]; // #b45309
  const colorAmberBg = [254, 243, 199]; // #fef3c7
  const colorAmberBorder = [253, 230, 138]; // #fde68a

  // Helper to check page overflow and add a new page if needed
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  const nowIsoDate = new Date().toISOString().split('T')[0];

  // Determine explicit patient name vs "Not documented"
  // For uploaded records, check if any document had an explicit patient name
  const docWithPatient = documents.find((d) => Boolean(d.patientName));
  const rawPatientName = isDemoMode
    ? `${patientInfo.name || 'Ananya Rao'} (Demo Patient)`
    : (docWithPatient?.patientName || null);
  const rawAgeOrDob = isDemoMode
    ? patientInfo.ageOrDob
    : (docWithPatient?.patientAgeOrDob || null);

  const displayPatientName = isDemoMode
    ? `${patientInfo.name || 'Ananya Rao'} [DEMO PATIENT]`
    : (rawPatientName || 'Not documented');
  const displayAgeOrDob = rawAgeOrDob || 'Not documented';
  const displayRecordId = isDemoMode ? patientInfo.id : (docWithPatient?.id || 'DOC-SESSION-1');

  // ====================================================
  // HEADER
  // MediChron AI
  // Subtitle: Medical Record Timeline & Handoff Summary
  // ====================================================
  ensureSpace(70);

  // Top Teal Accent Line
  doc.setFillColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.rect(marginLeft, y, contentWidth, 3.5, 'F');
  y += 15;

  // Title: MediChron AI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
  doc.text('MediChron AI', marginLeft, y);

  // AI Tag badge
  doc.setFillColor(colorTealBg[0], colorTealBg[1], colorTealBg[2]);
  doc.setDrawColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.roundedRect(marginLeft + 138, y - 14, 26, 16, 3, 3, 'FD');
  doc.setFontSize(8.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('AI', marginLeft + 145, y - 3);

  // Mode Indicator Badge on top right
  const modeText = isDemoMode ? 'DEMO DATA — FICTIONAL PATIENT' : 'LIVE DOCUMENT EXTRACTION';
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  if (isDemoMode) {
    doc.setFillColor(colorAmberBg[0], colorAmberBg[1], colorAmberBg[2]);
    doc.setTextColor(colorAmberDark[0], colorAmberDark[1], colorAmberDark[2]);
    doc.setDrawColor(colorAmberBorder[0], colorAmberBorder[1], colorAmberBorder[2]);
  } else {
    doc.setFillColor(colorTealBg[0], colorTealBg[1], colorTealBg[2]);
    doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
    doc.setDrawColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  }
  const modeWidth = doc.getTextWidth(modeText) + 16;
  doc.roundedRect(pageWidth - marginRight - modeWidth, y - 15, modeWidth, 18, 4, 4, 'FD');
  doc.text(modeText, pageWidth - marginRight - modeWidth + 8, y - 3);

  y += 18;

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
  doc.text('Medical Record Timeline & Handoff Summary', marginLeft, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
  doc.text(
    `Document Generated: ${nowIsoDate} · Deterministic synthesis from uploaded medical record data`,
    marginLeft,
    y
  );
  y += 14;

  // Horizontal divider
  doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
  doc.setLineWidth(0.75);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 16;

  // ====================================================
  // 1. PATIENT / RECORD INFORMATION
  // ====================================================
  ensureSpace(70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('1. PATIENT / RECORD INFORMATION', marginLeft, y);
  y += 10;

  // Patient Card Frame
  doc.setFillColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
  doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
  doc.roundedRect(marginLeft, y, contentWidth, 50, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
  doc.text('PATIENT IDENTIFIER', marginLeft + 14, y + 16);
  doc.text('AGE / DOB', marginLeft + 210, y + 16);
  doc.text('RECORD IDENTIFIER', marginLeft + 350, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
  doc.text(displayPatientName, marginLeft + 14, y + 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
  doc.text(displayAgeOrDob, marginLeft + 210, y + 33);
  doc.text(displayRecordId, marginLeft + 350, y + 33);

  y += 62;

  // ====================================================
  // 2. RECORD OVERVIEW
  // ====================================================
  ensureSpace(66);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('2. RECORD OVERVIEW', marginLeft, y);
  y += 10;

  const kpis = [
    { label: 'Documents analyzed', value: String(stats.totalDocuments) },
    { label: 'Events extracted', value: String(stats.totalEvents) },
    { label: 'Documented diagnoses', value: String(stats.totalDiagnoses) },
    { label: 'Documented medications', value: String(stats.totalMedications) },
    { label: 'Potential conflicts', value: String(stats.totalConflicts) },
    { label: 'Record coverage gaps', value: String(stats.totalGaps) },
  ];

  const colWidth = (contentWidth - 5 * 6) / 6;
  kpis.forEach((kpi, idx) => {
    const kpiX = marginLeft + idx * (colWidth + 6);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
    doc.roundedRect(kpiX, y, colWidth, 40, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
    doc.text(kpi.value, kpiX + colWidth / 2, y + 17, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
    const splitLabel = doc.splitTextToSize(kpi.label, colWidth - 4);
    doc.text(splitLabel, kpiX + colWidth / 2, y + 29, { align: 'center' });
  });

  y += 52;

  // ====================================================
  // 3. CHRONOLOGICAL MEDICAL TIMELINE
  // ====================================================
  ensureSpace(60);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('3. CHRONOLOGICAL MEDICAL TIMELINE', marginLeft, y);
  y += 12;

  if (events && events.length > 0) {
    // Sort events chronologically
    const sortedEvents = [...events].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

    sortedEvents.forEach((ev) => {
      // Build event details
      const detailLines: string[] = [];

      if (ev.symptoms && ev.symptoms.length > 0) {
        detailLines.push(`• Documented Symptoms: ${ev.symptoms.join(', ')}`);
      }
      if (ev.diagnoses && ev.diagnoses.length > 0) {
        detailLines.push(
          `• Documented Diagnoses: ${ev.diagnoses
            .map((d) => `${d.text} [Certainty: ${d.certainty}]`)
            .join('; ')}`
        );
      }
      if (ev.medications && ev.medications.length > 0) {
        detailLines.push(
          `• Documented Medications: ${ev.medications
            .map((m) => `${m.name} ${m.dose || ''} ${m.frequency || ''} [Status: ${m.status}]`.trim())
            .join('; ')}`
        );
      }
      if (ev.tests && ev.tests.length > 0) {
        detailLines.push(
          `• Tests and Results: ${ev.tests
            .map((t) => `${t.name}: ${t.resultValue || t.resultText || t.status} ${t.unit || ''}`.trim())
            .join('; ')}`
        );
      }
      if (ev.treatments && ev.treatments.length > 0) {
        detailLines.push(`• Treatments: ${ev.treatments.join(', ')}`);
      }

      const formattedDate = formatDate(ev.date, ev.datePrecision);
      const confPercent = Math.round(ev.confidence * 100);
      const sourceCitation = `Source Document: ${ev.sourceDocument}${ev.sourcePage ? ` (Page ${ev.sourcePage})` : ''}${ev.provider ? ` · Provider: ${ev.provider}` : ''}`;
      const evidenceQuote = ev.evidenceText
        ? `Evidence Text: "${ev.evidenceText}"`
        : 'Evidence Text: Documented in uploaded record';

      // Calculate heights
      const wrappedDetails = detailLines.length > 0
        ? doc.splitTextToSize(detailLines.join('\n'), contentWidth - 28)
        : ['No secondary symptoms or treatments noted'];
      const wrappedEvidence = doc.splitTextToSize(evidenceQuote, contentWidth - 28);
      const wrappedCitation = doc.splitTextToSize(sourceCitation, contentWidth - 28);

      const cardHeight =
        36 +
        wrappedDetails.length * 11 +
        wrappedEvidence.length * 10.5 +
        wrappedCitation.length * 10 +
        16;

      ensureSpace(cardHeight + 8);

      // Card Box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
      doc.roundedRect(marginLeft, y, contentWidth, cardHeight, 4, 4, 'FD');

      // Left Accent Strip
      doc.setFillColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
      doc.roundedRect(marginLeft, y, 4, cardHeight, 2, 2, 'F');

      // Header Line: Date & Event Type
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
      doc.text(`${formattedDate}  ·  [${ev.eventType.toUpperCase()}]`, marginLeft + 12, y + 14);

      // Confidence on right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
      doc.text(`Confidence: ${confPercent}% (${ev.evidenceBasis})`, pageWidth - marginRight - 12, y + 14, {
        align: 'right',
      });

      // Event Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text(ev.title, marginLeft + 12, y + 27);

      let cardY = y + 40;

      // Documented Findings & Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      doc.text(wrappedDetails, marginLeft + 12, cardY);
      cardY += wrappedDetails.length * 11 + 4;

      // Evidence Text
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
      doc.text(wrappedEvidence, marginLeft + 12, cardY);
      cardY += wrappedEvidence.length * 10.5 + 4;

      // Source Document citation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
      doc.text(wrappedCitation, marginLeft + 12, cardY);

      y += cardHeight + 8;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
    doc.text('No chronological events documented in this record set.', marginLeft, y);
    y += 16;
  }

  y += 12;

  // ====================================================
  // 4. POTENTIAL DOCUMENT CONFLICTS
  // ====================================================
  ensureSpace(70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('4. POTENTIAL DOCUMENT CONFLICTS', marginLeft, y);
  y += 12;

  // Required statement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(colorAmberDark[0], colorAmberDark[1], colorAmberDark[2]);
  doc.text('Potential document conflict — verify against original records.', marginLeft, y);
  y += 14;

  if (conflicts && conflicts.length > 0) {
    conflicts.forEach((c) => {
      ensureSpace(85);

      const sideA = c.sides[0];
      const sideB = c.sides[1];

      const eventA = sideA ? events.find((e) => e.id === sideA.eventId) : undefined;
      const eventB = sideB ? events.find((e) => e.id === sideB.eventId) : undefined;

      const pageAStr = eventA?.sourcePage ? ` (p.${eventA.sourcePage})` : '';
      const pageBStr = eventB?.sourcePage ? ` (p.${eventB.sourcePage})` : '';

      const sideAText = sideA
        ? `Value: "${sideA.valueText}"  |  Source: ${sideA.documentName}${pageAStr}  |  Date: ${sideA.date ? formatDate(sideA.date) : 'Not documented'}`
        : 'Value: Not specified in record A';
      const sideBText = sideB
        ? `Value: "${sideB.valueText}"  |  Source: ${sideB.documentName}${pageBStr}  |  Date: ${sideB.date ? formatDate(sideB.date) : 'Not documented'}`
        : 'Value: Not specified in record B';

      const descLines = doc.splitTextToSize(`Description: ${c.description}`, contentWidth - 24);
      const sideALines = doc.splitTextToSize(`Record A — ${sideAText}`, contentWidth - 24);
      const sideBLines = doc.splitTextToSize(`Record B — ${sideBText}`, contentWidth - 24);

      const conflictHeight = 34 + descLines.length * 11 + sideALines.length * 10 + sideBLines.length * 10 + 10;
      ensureSpace(conflictHeight);

      doc.setFillColor(colorAmberBg[0], colorAmberBg[1], colorAmberBg[2]);
      doc.setDrawColor(colorAmberBorder[0], colorAmberBorder[1], colorAmberBorder[2]);
      doc.roundedRect(marginLeft, y, contentWidth, conflictHeight, 4, 4, 'FD');

      // Left Amber Accent Strip
      doc.setFillColor(colorAmberDark[0], colorAmberDark[1], colorAmberDark[2]);
      doc.roundedRect(marginLeft, y, 4, conflictHeight, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text(`Conflict: ${c.title}`, marginLeft + 12, y + 16);

      let confY = y + 28;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      doc.text(descLines, marginLeft + 12, confY);
      confY += descLines.length * 11 + 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(colorAmberDark[0], colorAmberDark[1], colorAmberDark[2]);
      doc.text(sideALines, marginLeft + 12, confY);
      confY += sideALines.length * 10 + 3;
      doc.text(sideBLines, marginLeft + 12, confY);

      y += conflictHeight + 8;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
    doc.text('No conflicting medications, dosages, or contradicting diagnoses detected in uploaded records.', marginLeft, y);
    y += 16;
  }

  y += 12;

  // ====================================================
  // 5. RECORD COVERAGE
  // ====================================================
  ensureSpace(70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('5. RECORD COVERAGE & CONTINUITY', marginLeft, y);
  y += 12;

  // Required statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
  doc.text(
    'Record gaps represent missing uploaded documentation and do not indicate absence of medical care.',
    marginLeft,
    y
  );
  y += 14;

  if (gaps && gaps.length > 0) {
    gaps.forEach((g) => {
      ensureSpace(38);

      doc.setFillColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
      doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
      doc.roundedRect(marginLeft, y, contentWidth, 32, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text(`No uploaded records found for this period: ${g.days} days`, marginLeft + 12, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
      doc.text(
        `Span: ${formatDate(g.startDate)} to ${formatDate(g.endDate)} (${g.days} calendar days)`,
        marginLeft + 12,
        y + 25
      );

      y += 38;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
    doc.text('No documentation gaps exceeding the continuity threshold found in current record stream.', marginLeft, y);
    y += 16;
  }

  y += 12;

  // ====================================================
  // 6. HANDOFF SUMMARY
  // ====================================================
  ensureSpace(70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('6. HANDOFF SUMMARY', marginLeft, y);
  y += 14;

  if (handoffSummary.sections && handoffSummary.sections.length > 0) {
    handoffSummary.sections.forEach((sec) => {
      ensureSpace(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text(sec.heading.toUpperCase(), marginLeft, y);
      y += 12;

      sec.bullets.forEach((bullet) => {
        const bulletText = `•  ${bullet.text}`;
        const lines = doc.splitTextToSize(bulletText, contentWidth - 16);
        ensureSpace(lines.length * 11.5 + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
        doc.text(lines, marginLeft + 8, y);
        y += lines.length * 11.5 + 3;
      });

      y += 6;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
    doc.text('No structured handoff sections available for this dataset.', marginLeft, y);
    y += 14;
  }

  y += 12;

  // ====================================================
  // 7. SOURCES
  // ====================================================
  ensureSpace(60);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(colorTealDark[0], colorTealDark[1], colorTealDark[2]);
  doc.text('7. SOURCES & DOCUMENT CITATIONS', marginLeft, y);
  y += 12;

  if (documents && documents.length > 0) {
    documents.forEach((d, idx) => {
      ensureSpace(24);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text(`[Doc ${idx + 1}]  ${d.fileName}`, marginLeft + 8, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
      const docTypeStr = `Type: ${d.documentType.replace('_', ' ')} · Date: ${d.documentDate || 'Not dated'} · ${d.eventCount} event${d.eventCount === 1 ? '' : 's'} extracted`;
      doc.text(docTypeStr, marginLeft + 230, y);

      y += 15;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
    doc.text('No source files uploaded or recorded.', marginLeft, y);
    y += 15;
  }

  y += 14;

  // ====================================================
  // 8. DISCLAIMER
  // ====================================================
  ensureSpace(50);

  doc.setFillColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
  doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
  doc.roundedRect(marginLeft, y, contentWidth, 42, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
  doc.text('8. CLINICAL & REGULATORY DISCLAIMER', marginLeft + 10, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
  const disclaimerText =
    'Generated from uploaded records for organization and review. Not medical advice. This document does not diagnose, prescribe, recommend treatment, or replace professional clinical judgment.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 20);
  doc.text(disclaimerLines, marginLeft + 10, y + 25);

  y += 50;

  // ====================================================
  // RUNNING HEADERS, FOOTERS & PAGE NUMBERS
  // ====================================================
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (pages > 1)
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
      doc.text('MediChron AI · Medical Record Timeline & Handoff Summary', marginLeft, 28);
      doc.text(`${displayPatientName} · ${nowIsoDate}`, pageWidth - marginRight, 28, { align: 'right' });
      doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, 32, pageWidth - marginRight, 32);
    }

    // Running Footer
    doc.setDrawColor(colorSlateBorder[0], colorSlateBorder[1], colorSlateBorder[2]);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, pageHeight - 30, pageWidth - marginRight, pageHeight - 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colorSlateMuted[0], colorSlateMuted[1], colorSlateMuted[2]);
    doc.text(
      'Strictly verifiable against source document citations. Never Hallucinates.',
      marginLeft,
      pageHeight - 18
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginRight, pageHeight - 18, {
      align: 'right',
    });
  }

  // Exact file name requested: MediChron_Handoff_Summary_<date>.pdf (e.g. MediChron_Handoff_Summary_2026-09-30.pdf)
  const fileName = `MediChron_Handoff_Summary_${nowIsoDate}.pdf`;

  // Extract base64 data URL string for emailing without extra processing
  const dataUri = doc.output('datauristring');
  const base64Data = dataUri.split(',')[1] || '';

  const download = () => {
    doc.save(fileName);
  };

  // Download directly to client browser unless skipAutoDownload is set
  if (!options.skipAutoDownload) {
    download();
  }

  return {
    fileName,
    base64Data,
    doc,
    download,
  };
}
