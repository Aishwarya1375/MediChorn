import React, { useState } from 'react';
import {
  AlertTriangle,
  Scale,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/dates';

export const ConflictsScreen: React.FC = () => {
  const { conflicts, setSelectedEventId, setSourceViewerState } = useApp();
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [reviewedStatus, setReviewedStatus] = useState<Record<string, boolean>>({});

  const filteredConflicts = conflicts.filter((c) => {
    if (priorityFilter !== 'all' && c.reviewPriority !== priorityFilter) return false;
    return true;
  });

  const toggleReviewed = (id: string) => {
    setReviewedStatus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Potential Document Conflicts
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic detection of discrepancies between uploaded records
              </p>
            </div>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="font-semibold text-slate-500 mr-1">Priority:</span>
          {(['all', 'High', 'Medium', 'Low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors min-h-[36px] cursor-pointer ${
                priorityFilter === p
                  ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Non-negotiable Neutrality Explainer Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-3">
        <Scale className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Neutral Evaluation Principle: </span>
          MediChron presents differing statements side by side with verbatim evidence. It does not decide which record is correct or designate a &quot;winner&quot;. Always verify discrepancies with treating clinicians or original physical records.
        </div>
      </div>

      {/* Conflicts List */}
      {filteredConflicts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-800">
            No potential conflicts detected across the uploaded records.
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            All documented medication doses, statuses, and dates remain consistent across sources.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredConflicts.map((c) => {
            const isReviewed = Boolean(reviewedStatus[c.id]);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4"
              >
                {/* Mobile / Desktop Conflict Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      POTENTIAL CONFLICT
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.reviewPriority === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : c.reviewPriority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.reviewPriority} Priority
                    </span>
                  </div>

                  <button
                    onClick={() => toggleReviewed(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer min-h-[36px] self-start sm:self-auto ${
                      isReviewed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isReviewed ? '✓ Reviewed' : 'Mark as Reviewed'}
                  </button>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {c.title}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {c.description}
                  </p>
                </div>

                {/* Single Column on Mobile, 2-column on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {c.sides.map((side, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-700 uppercase tracking-wider">
                            {side.label}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {formatDate(side.date)}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-900 mb-1">
                          Source: {side.documentName}
                        </div>

                        {/* Highlighted Value */}
                        <div className="my-2 p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-950 font-bold text-xs sm:text-sm">
                          {side.valueText}
                        </div>

                        {/* Verbatim quote */}
                        {side.evidenceText && (
                          <blockquote className="font-serif-doc text-xs text-slate-700 italic border-l-2 border-teal-600 pl-2 mt-2 leading-snug">
                            &quot;{side.evidenceText}&quot;
                          </blockquote>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-xs flex-wrap">
                        <button
                          onClick={() => setSelectedEventId(side.eventId)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
                        >
                          <span>VIEW EVIDENCE</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            setSourceViewerState({
                              docId: side.documentId,
                              highlightText: side.evidenceText,
                            })
                          }
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer min-h-[36px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Open Document</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Non-alarmist Disclaimer Note */}
                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2.5 italic">
                  MediChron objectively presents documented discrepancies without clinical judgment. Verify with treating provider.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
