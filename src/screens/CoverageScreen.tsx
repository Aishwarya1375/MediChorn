import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  Clock,
  HelpCircle,
  Sliders,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  List,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getMonthKey, formatMonthHeader } from '../lib/dates';

export const CoverageScreen: React.FC = () => {
  const {
    events,
    gaps,
    openLoops,
    gapThreshold,
    setGapThreshold,
    setSelectedEventId,
  } = useApp();

  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

  // Monthly event distribution for visual coverage bar chart dynamically computed from event dates
  const monthlyStats = useMemo(() => {
    const datedEvents = events.filter((e) => e.date);
    if (datedEvents.length === 0) return [];

    const monthKeys = Array.from(new Set(datedEvents.map((e) => getMonthKey(e.date!)))).sort();
    if (monthKeys.length === 0) return [];

    const startMonth = monthKeys[0];
    const endMonth = monthKeys[monthKeys.length - 1];

    // Generate all consecutive YYYY-MM between start and end
    const [startYear, startM] = startMonth.split('-').map(Number);
    const [endYear, endM] = endMonth.split('-').map(Number);

    const allMonths: string[] = [];
    let curYear = startYear;
    let curM = startM;

    while (curYear < endYear || (curYear === endYear && curM <= endM)) {
      const monthStr = `${curYear}-${String(curM).padStart(2, '0')}`;
      allMonths.push(monthStr);
      curM++;
      if (curM > 12) {
        curM = 1;
        curYear++;
      }
    }

    const counts: Record<string, number> = {};
    allMonths.forEach((m) => (counts[m] = 0));

    datedEvents.forEach((e) => {
      const k = getMonthKey(e.date!);
      if (counts[k] !== undefined) counts[k]++;
    });

    const maxCount = Math.max(1, ...Object.values(counts));

    return allMonths.map((m) => ({
      monthKey: m,
      count: counts[m],
      heightPercent: Math.max(8, Math.round((counts[m] / maxCount) * 100)),
      isGap: counts[m] === 0,
    }));
  }, [events]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
            <CalendarRange className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Record Coverage & Documentation Gaps
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuity analysis, documentation intervals, and open loop tracking
            </p>
          </div>
        </div>

        {/* Gap Threshold Slider */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 text-xs w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 sm:flex-initial">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-700">
              <span>Threshold:</span>
              <span className="text-teal-700 font-mono font-bold">{gapThreshold} days</span>
            </div>
            <input
              type="range"
              min={14}
              max={120}
              step={1}
              value={gapThreshold}
              onChange={(e) => setGapThreshold(Number(e.target.value))}
              aria-label="Gap Detection Threshold in days"
              className="w-full sm:w-44 accent-teal-600 mt-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Non-negotiable Gap Principle Explainer Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-900">Explainable Gap Principle: </span>
          MediChron reports periods where <span className="font-semibold">&quot;No uploaded records found for this period.&quot;</span> It never assumes or asserts that clinical care did not happen during gaps. Care may have occurred at unrecorded facilities or outside this uploaded collection.
        </div>
      </div>

      {/* Monthly Coverage Visualization */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Monthly Documentation Volume & Gap Spans
            </h2>
            <p className="text-xs text-slate-500">
              Distribution of documented medical encounters and test events across months
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* View Mode Toggle for Mobile */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-white text-teal-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Chart</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-teal-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[11px]">Month by Month</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-teal-600" /> Documented
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-hatched-gap border border-slate-300" /> Gap
              </span>
            </div>
          </div>
        </div>

        {monthlyStats.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No dated events available to render coverage chart.
          </div>
        ) : viewMode === 'chart' ? (
          <div className="pt-4 pb-2">
            {/* Horizontally scrollable chart on mobile */}
            <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
              <div className="min-w-[400px] sm:min-w-0 flex items-end justify-between gap-1.5 sm:gap-2 h-40 border-b border-slate-200 px-1">
                {monthlyStats.map((item) => (
                  <div key={item.monthKey} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-900 transition-colors">
                      {item.count > 0 ? item.count : ''}
                    </span>

                    <div
                      style={{ height: `${item.heightPercent}%` }}
                      className={`w-full max-w-[44px] rounded-t-lg transition-all duration-300 ${
                        item.isGap
                          ? 'bg-hatched-gap border border-dashed border-slate-300'
                          : 'bg-teal-600 group-hover:bg-teal-700 shadow-2xs'
                      }`}
                      title={`${formatMonthHeader(item.monthKey)}: ${
                        item.count > 0 ? `${item.count} documented events` : 'No uploaded records found for this period'
                      }`}
                    />

                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 group-hover:font-bold whitespace-nowrap">
                      {item.monthKey.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 px-1">
              <span>{formatMonthHeader(monthlyStats[0]?.monthKey || '')}</span>
              <span className="text-[10px] sm:hidden text-slate-400 italic">← Scroll chart →</span>
              <span>{formatMonthHeader(monthlyStats[monthlyStats.length - 1]?.monthKey || '')}</span>
            </div>
          </div>
        ) : (
          /* Vertical Month-by-Month View */
          <div className="space-y-2 pt-2">
            {monthlyStats.map((item) => (
              <div
                key={item.monthKey}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  item.isGap
                    ? 'bg-hatched-gap/50 border-dashed border-slate-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      item.isGap ? 'bg-amber-400' : 'bg-teal-600'
                    }`}
                  />
                  <span className="font-semibold text-slate-900">
                    {formatMonthHeader(item.monthKey)}
                  </span>
                </div>

                <div>
                  {item.isGap ? (
                    <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      No uploaded records found for this period
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {item.count} event{item.count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Identified Documentation Gaps (> threshold) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Identified Gaps ({gaps.length})
          </h2>
          <p className="text-xs text-slate-500">
            Consecutive spans with no uploaded records exceeding your {gapThreshold}-day threshold
          </p>
        </div>

        {gaps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              No documentation gaps exceed {gapThreshold} days
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Events in this record collection maintain regular continuity within the threshold.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((g) => (
              <div
                key={g.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-dashed border-slate-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-hatched-gap/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      No uploaded records found for this period
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {g.days} days
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    {formatDate(g.startDate)} — {formatDate(g.endDate)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Spans between preceding and subsequent documented visits. Care may have occurred elsewhere.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs pt-1 sm:pt-0">
                  {g.previousEventId && (
                    <button
                      onClick={() => setSelectedEventId(g.previousEventId)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer min-h-[36px]"
                    >
                      Preceding Record
                    </button>
                  )}
                  {g.nextEventId && (
                    <button
                      onClick={() => setSelectedEventId(g.nextEventId)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer min-h-[36px]"
                    >
                      Subsequent Record
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Loops Tracking */}
      {openLoops.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Open Clinical Loops ({openLoops.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {openLoops.map((loop) => (
              <div
                key={loop.id}
                onClick={() => setSelectedEventId(loop.sourceEventId)}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{loop.planText}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {loop.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  {loop.explanation || `Expected Window: ${formatDate(loop.expectedWindowStart)} – ${formatDate(loop.expectedWindowEnd)}`}
                </p>
                <div className="pt-1 text-[11px] text-teal-700 font-semibold hover:underline">
                  View Source Record ({loop.sourceDocument}) →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
