import React, { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, Calendar, User, Building, CheckCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/dates';

export const SourceViewerModal: React.FC = () => {
  const { sourceViewerState, setSourceViewerState, documents, events, setSelectedEventId } =
    useApp();
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  useEffect(() => {
    if (sourceViewerState?.highlightText) {
      setActiveHighlight(sourceViewerState.highlightText);
    }
  }, [sourceViewerState]);

  if (!sourceViewerState) return null;

  const doc = documents.find((d) => d.id === sourceViewerState.docId);
  if (!doc) return null;

  const docEvents = events.filter((e) => e.sourceDocumentId === doc.id);

  // Helper to render realistic document paper with highlighted quotes
  const renderDocumentBody = (rawText: string, highlight: string | null) => {
    if (!highlight) {
      return <pre className="whitespace-pre-wrap break-words font-serif-doc text-xs sm:text-sm text-slate-800 leading-relaxed">{rawText}</pre>;
    }

    // Try finding exact quote or sub-phrases
    const cleanHighlight = highlight.trim();
    const index = rawText.indexOf(cleanHighlight);

    if (index !== -1) {
      const before = rawText.substring(0, index);
      const match = rawText.substring(index, index + cleanHighlight.length);
      const after = rawText.substring(index + cleanHighlight.length);

      return (
        <pre className="whitespace-pre-wrap break-words font-serif-doc text-xs sm:text-sm text-slate-800 leading-relaxed">
          {before}
          <mark className="bg-amber-200/90 text-amber-950 px-1 py-0.5 rounded font-semibold border-b-2 border-amber-500 shadow-2xs">
            {match}
          </mark>
          {after}
        </pre>
      );
    }

    // Fallback: search for first sentence of highlight
    const firstSentence = cleanHighlight.split('\n')[0].substring(0, 40);
    const subIndex = rawText.indexOf(firstSentence);
    if (subIndex !== -1) {
      const before = rawText.substring(0, subIndex);
      const match = rawText.substring(subIndex, subIndex + firstSentence.length);
      const after = rawText.substring(subIndex + firstSentence.length);
      return (
        <pre className="whitespace-pre-wrap break-words font-serif-doc text-xs sm:text-sm text-slate-800 leading-relaxed">
          {before}
          <mark className="bg-amber-200/90 text-amber-950 px-1 py-0.5 rounded font-semibold border-b-2 border-amber-500">
            {match}
          </mark>
          {after}
        </pre>
      );
    }

    return <pre className="whitespace-pre-wrap break-words font-serif-doc text-xs sm:text-sm text-slate-800 leading-relaxed">{rawText}</pre>;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[95vh] sm:h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="source-viewer-title" className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {doc.fileName}
                </h2>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold uppercase">
                  {doc.documentType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                <span>Date: {formatDate(doc.documentDate)}</span>
                {doc.facility && <span className="hidden sm:inline">· {doc.facility}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSourceViewerState(null)}
              aria-label="Close document viewer"
              className="p-2 min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Split View: Left Document Paper, Right Extracted Facts */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100/60">
          {/* Left Column: Realistic Document Paper */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
            <div className="w-full max-w-2xl bg-white shadow-md rounded-xl border border-slate-200 p-6 sm:p-10 min-h-[600px] flex flex-col justify-between">
              {/* Paper Content */}
              <div>
                <div className="border-b-2 border-slate-900 pb-3 mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase font-sans">
                      {doc.facility || 'Clinical Healthcare Documentation'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans">
                      {doc.provider || 'Medical Record & Diagnostic Assessment'}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 font-sans">
                    <div>Doc ID: {doc.id}</div>
                    <div>Date: {formatDate(doc.documentDate)}</div>
                  </div>
                </div>

                {/* Patient Context header in paper */}
                {doc.patientName && (
                  <div className="mb-6 p-3 bg-slate-50 rounded border border-slate-200 text-xs font-sans flex justify-between">
                    <div>
                      <span className="font-semibold text-slate-700">Patient: </span>
                      <span className="text-slate-900 font-bold">{doc.patientName}</span>
                    </div>
                    {doc.patientAgeOrDob && (
                      <div>
                        <span className="font-semibold text-slate-700">Age / Sex: </span>
                        <span>{doc.patientAgeOrDob}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Body */}
                <div className="document-paper-body text-slate-800">
                  {doc.rawText ? (
                    renderDocumentBody(doc.rawText, activeHighlight)
                  ) : doc.fileUrl ? (
                    <div className="space-y-4">
                      {activeHighlight && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 font-serif-doc italic">
                          <span className="font-sans font-bold not-italic text-amber-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                            Selected Evidence Quote:
                          </span>
                          &quot;{activeHighlight}&quot;
                        </div>
                      )}
                      {doc.mimeType === 'application/pdf' || doc.fileUrl.startsWith('data:application/pdf') ? (
                        <iframe
                          src={doc.fileUrl}
                          className="w-full h-[650px] rounded-lg border border-slate-200 shadow-inner bg-slate-50"
                          title={`PDF Preview - ${doc.fileName}`}
                        />
                      ) : (
                        <div className="text-center py-6">
                          <img
                            src={doc.fileUrl}
                            alt="Uploaded file preview"
                            className="max-h-[600px] mx-auto rounded-lg border border-slate-200 shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">
                      No raw text or preview available for this file.
                    </div>
                  )}
                </div>
              </div>

              {/* Document Paper Footer */}
              <div className="mt-12 pt-4 border-t border-slate-200 text-[10px] text-slate-400 font-sans flex justify-between">
                <span>Page 1 of {doc.pageCount || 1}</span>
                <span>Authentic Record Extraction Traceability</span>
              </div>
            </div>
          </div>

          {/* Right Column: Events Extracted from This Record */}
          <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-200 bg-white p-5 overflow-y-auto flex flex-col">
            <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Extracted Facts ({docEvents.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click any fact to highlight its proof
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>

            <div className="space-y-3 flex-1">
              {docEvents.map((ev) => {
                const isSelected = activeHighlight === ev.evidenceText;
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      if (ev.evidenceText) setActiveHighlight(ev.evidenceText);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/70 ring-1 ring-teal-500 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-900 line-clamp-1">
                        {ev.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {ev.eventType}
                      </span>
                    </div>

                    {ev.evidenceText && (
                      <p className="font-serif-doc text-[11px] text-slate-600 italic line-clamp-2 border-l-2 border-teal-500 pl-2">
                        &quot;{ev.evidenceText}&quot;
                      </p>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-teal-700 font-medium hover:underline">
                        {isSelected ? '✓ Proof Highlighted' : 'Show Proof'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(ev.id);
                          setSourceViewerState(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 hover:underline"
                      >
                        Open Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
