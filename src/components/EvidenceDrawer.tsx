import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Flag,
  Calendar,
  Building,
  User,
  ShieldAlert,
  FileCheck,
  Tag,
  AlertTriangle,
  Link2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/dates';
import { TimelineEvent } from '../types';

export const EvidenceDrawer: React.FC = () => {
  const {
    selectedEventId,
    setSelectedEventId,
    events,
    conflicts,
    setSourceViewerState,
    setReviewStatus,
    setScreen,
  } = useApp();

  const [noteInput, setNoteInput] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const eventIndex = events.findIndex((e) => e.id === selectedEventId);
  const currentEvent: TimelineEvent | undefined = events[eventIndex];

  useEffect(() => {
    if (currentEvent) {
      setNoteInput(currentEvent.review?.note || '');
      setIsEditingNote(false);
    }
  }, [currentEvent?.id]);

  // Keyboard navigation: Esc to close, ArrowLeft / ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedEventId) return;
      if (e.key === 'Escape') {
        setSelectedEventId(null);
      } else if (e.key === 'ArrowLeft' && eventIndex > 0) {
        setSelectedEventId(events[eventIndex - 1].id);
      } else if (e.key === 'ArrowRight' && eventIndex < events.length - 1) {
        setSelectedEventId(events[eventIndex + 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEventId, eventIndex, events]);

  if (!selectedEventId || !currentEvent) return null;

  const prevEvent = eventIndex > 0 ? events[eventIndex - 1] : null;
  const nextEvent = eventIndex < events.length - 1 ? events[eventIndex + 1] : null;

  // Check if this event is involved in any potential conflict
  const relevantConflicts = conflicts.filter((c) =>
    c.sides.some((s) => s.eventId === currentEvent.id)
  );

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          High ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    if (confidence >= 0.6) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Medium ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Low ({Math.round(confidence * 100)}%)
      </span>
    );
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'visit':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'test':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'diagnosis':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'medication':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'treatment':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'follow_up':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleSaveNote = () => {
    setReviewStatus(currentEvent.id, currentEvent.review.state, noteInput);
    setIsEditingNote(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div
        onClick={() => setSelectedEventId(null)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Detail Modal / Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Event Evidence and Source Details"
        className="relative z-10 w-full sm:w-[500px] bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Top Navigation & Actions */}
        <div className="h-14 sm:h-16 border-b border-slate-100 px-4 sm:px-5 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => prevEvent && setSelectedEventId(prevEvent.id)}
              disabled={!prevEvent}
              title="Previous event (←)"
              aria-label="Previous event"
              className="p-2 min-w-[40px] min-h-[40px] rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-slate-500 font-mono px-1">
              {eventIndex + 1} of {events.length}
            </span>
            <button
              onClick={() => nextEvent && setSelectedEventId(nextEvent.id)}
              disabled={!nextEvent}
              title="Next event (→)"
              aria-label="Next event"
              className="p-2 min-w-[40px] min-h-[40px] rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Event Details</span>
            <button
              onClick={() => setSelectedEventId(null)}
              title="Close panel (Esc)"
              aria-label="Close details"
              className="p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain safe-area-pb">
        {/* Header Tags & Title */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${getCategoryColor(
                currentEvent.eventType
              )}`}
            >
              {currentEvent.eventType.replace('_', ' ')}
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(currentEvent.date, currentEvent.datePrecision)}
            </span>

            <span
              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
              title={`Date basis: ${currentEvent.dateBasis}`}
            >
              Basis: {currentEvent.dateBasis.replace('_', ' ')}
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 leading-snug">
            {currentEvent.title}
          </h2>

          {(currentEvent.provider || currentEvent.facility) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              {currentEvent.provider && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {currentEvent.provider}
                </span>
              )}
              {currentEvent.facility && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {currentEvent.facility}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Potential Conflict Callout (if any) */}
        {relevantConflicts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Potential Document Conflict Involving This Event
            </div>
            <p className="text-amber-800 leading-relaxed">
              {relevantConflicts[0].description}
            </p>
            <button
              onClick={() => {
                setSelectedEventId(null);
                setScreen('conflicts');
              }}
              className="mt-2 text-xs font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
            >
              View in Conflicts Page →
            </button>
          </div>
        )}

        {/* What the Record Documents */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-teal-600" />
            What the Record Documents
          </div>

          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3 text-xs text-slate-700">
            {/* Symptoms */}
            {currentEvent.symptoms.length > 0 && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  Documented Symptoms:
                </span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {currentEvent.symptoms.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diagnoses */}
            {currentEvent.diagnoses.length > 0 && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1.5">
                  Documented Diagnoses:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentEvent.diagnoses.map((d, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800"
                    >
                      <span className="font-medium">{d.text}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1 rounded ${
                          d.certainty === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.certainty === 'suspected'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {d.certainty}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tests & Results */}
            {currentEvent.tests.length > 0 && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1.5">
                  Documented Tests & Findings:
                </span>
                <div className="space-y-2">
                  {currentEvent.tests.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Status: <span className="capitalize">{t.status}</span>
                          {t.referenceRange && ` · Ref: ${t.referenceRange}`}
                        </div>
                      </div>
                      {t.resultValue ? (
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">
                            {t.resultValue} {t.unit || ''}
                          </div>
                          {t.reportFlag && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block ${
                                t.reportFlag === 'HIGH'
                                  ? 'bg-rose-100 text-rose-800'
                                  : t.reportFlag === 'NORMAL'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Report flag: {t.reportFlag}
                            </span>
                          )}
                        </div>
                      ) : t.resultText ? (
                        <div className="text-slate-700 font-medium">{t.resultText}</div>
                      ) : (
                        <span className="text-slate-400 italic">Ordered</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {currentEvent.medications.length > 0 && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1.5">
                  Documented Medications:
                </span>
                <div className="space-y-2">
                  {currentEvent.medications.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-slate-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{m.name}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          {m.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Dose: <span className="font-medium text-slate-900">{m.dose || 'Not specified'}</span>
                        {m.frequency && ` · ${m.frequency}`}
                        {m.duration && ` · ${m.duration}`}
                        {m.statusNote && ` · (${m.statusNote})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatments */}
            {currentEvent.treatments.length > 0 && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  Documented Treatments & Advice:
                </span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {currentEvent.treatments.map((tr, idx) => (
                    <li key={idx}>{tr}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up */}
            {currentEvent.followUp && (
              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  Documented Follow-up Plan:
                </span>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-slate-800">
                    {currentEvent.followUp.purpose || 'Follow-up appointment'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Planned interval:{' '}
                    <span className="font-medium text-slate-700">
                      {currentEvent.followUp.plannedInterval || 'Not specified'}
                    </span>
                    {currentEvent.followUp.plannedDate &&
                      ` (Derived target: ${currentEvent.followUp.plannedDate})`}
                  </div>
                </div>
              </div>
            )}

            {/* Clinical Note snippet */}
            {currentEvent.notes && (
              <div className="pt-1 text-slate-600">
                <span className="font-semibold text-slate-900">Document Note: </span>
                {currentEvent.notes}
              </div>
            )}
          </div>
        </div>

        {/* Verbatim Supporting Evidence (The Core Explainability Element) */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Verbatim Supporting Evidence</span>
            <span className="text-[11px] font-normal text-teal-700 lowercase">
              exact quoted text
            </span>
          </div>

          <div className="relative p-4 rounded-xl bg-slate-50 border-l-4 border-teal-600 border border-slate-200/80 shadow-2xs">
            <blockquote className="font-serif-doc text-slate-800 text-sm leading-relaxed italic whitespace-pre-line">
              &quot;{currentEvent.evidenceText || 'Evidence unavailable in record.'}&quot;
            </blockquote>
          </div>
        </div>

        {/* Source Document Details & Viewer CTA */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Source Record
            </span>
            <span className="text-xs font-mono text-slate-500">
              Page {currentEvent.sourcePage ?? 1}
            </span>
          </div>

          <div>
            <div className="font-semibold text-xs text-slate-900">
              {currentEvent.sourceDocument}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Source ID: {currentEvent.sourceDocumentId}
            </div>
          </div>

          <button
            onClick={() => {
              setSourceViewerState({
                docId: currentEvent.sourceDocumentId,
                highlightText: currentEvent.evidenceText,
                page: currentEvent.sourcePage,
              });
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Source Document & Highlight Proof
          </button>
        </div>

        {/* Confidence & Evidence Basis */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Confidence & Basis
            </span>
            {getConfidenceBadge(currentEvent.confidence)}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Evidence Basis:</span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                currentEvent.evidenceBasis === 'explicit'
                  ? 'bg-blue-100 text-blue-800'
                  : currentEvent.evidenceBasis === 'inferred'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentEvent.evidenceBasis}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {currentEvent.confidenceReason}
          </p>
        </div>

        {/* Corroborated By Other Records */}
        {currentEvent.corroboratedBy && currentEvent.corroboratedBy.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-teal-600" />
              Corroborated by ({currentEvent.corroboratedBy.length}) Additional Record
            </div>
            <div className="space-y-2">
              {currentEvent.corroboratedBy.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-slate-700"
                >
                  <div className="font-semibold text-slate-900">{c.sourceDocument}</div>
                  {c.evidenceText && (
                    <blockquote className="font-serif-doc mt-1 text-[11px] text-slate-700 italic border-l-2 border-teal-500 pl-2">
                      &quot;{c.evidenceText}&quot;
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review & Clinician Controls */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Review State
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setReviewStatus(
                  currentEvent.id,
                  currentEvent.review.state === 'confirmed' ? 'unreviewed' : 'confirmed'
                )
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                currentEvent.review.state === 'confirmed'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {currentEvent.review.state === 'confirmed' ? 'Confirmed' : 'Mark Confirmed'}
            </button>

            <button
              onClick={() =>
                setReviewStatus(
                  currentEvent.id,
                  currentEvent.review.state === 'flagged' ? 'unreviewed' : 'flagged'
                )
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                currentEvent.review.state === 'flagged'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flag className="w-4 h-4" />
              {currentEvent.review.state === 'flagged' ? 'Flagged' : 'Flag for Review'}
            </button>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-slate-100">
            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a clinical or administrative verification note..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1 text-xs bg-teal-700 text-white font-medium rounded hover:bg-teal-800"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {currentEvent.review.note
                    ? `Note: ${currentEvent.review.note}`
                    : 'No review note added.'}
                </span>
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-teal-700 hover:underline font-medium ml-2"
                >
                  {currentEvent.review.note ? 'Edit' : 'Add Note'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
