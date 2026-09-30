import React, { useMemo } from 'react';
import {
  Pill,
  FlaskConical,
  AlertTriangle,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/dates';
import { TimelineEvent } from '../types';

export const MedsLabsScreen: React.FC = () => {
  const { events, conflicts, setSelectedEventId, isDemoMode } = useApp();

  // Dynamic extraction of lab trends from events
  const labTrends = useMemo(() => {
    const testMap = new Map<
      string,
      {
        name: string;
        unit: string;
        referenceRange: string;
        values: Array<{
          date: string;
          val: number;
          displayVal: string;
          flag: string | null;
          eventId: string;
          doc: string;
        }>;
      }
    >();

    events.forEach((ev) => {
      if (!ev.date) return;
      ev.tests.forEach((t) => {
        if (t.status === 'resulted' && t.resultValue) {
          const numVal = parseFloat(t.resultValue.replace(/[^0-9.]/g, ''));
          const key = t.normalizedName.toLowerCase().trim();

          if (!testMap.has(key)) {
            testMap.set(key, {
              name: t.name,
              unit: t.unit || '',
              referenceRange: t.referenceRange || '',
              values: [],
            });
          }

          const entry = testMap.get(key)!;
          entry.values.push({
            date: ev.date!,
            val: isNaN(numVal) ? 0 : numVal,
            displayVal: t.resultValue,
            flag: t.reportFlag || null,
            eventId: ev.id,
            doc: ev.sourceDocument,
          });
        }
      });
    });

    const results: Array<{
      name: string;
      unit: string;
      referenceRange: string;
      values: Array<{
        date: string;
        val: number;
        displayVal: string;
        flag: string | null;
        eventId: string;
        doc: string;
      }>;
      minScale: number;
      maxScale: number;
    }> = [];

    testMap.forEach((entry) => {
      // Sort chronologically
      entry.values.sort((a, b) => a.date.localeCompare(b.date));

      const numericVals = entry.values.map((v) => v.val).filter((v) => v > 0);
      const minVal = numericVals.length > 0 ? Math.min(...numericVals) : 0;
      const maxVal = numericVals.length > 0 ? Math.max(...numericVals) : 100;
      const span = maxVal - minVal;
      const padding = span > 0 ? span * 0.2 : minVal * 0.2 || 1;

      results.push({
        name: entry.name,
        unit: entry.unit,
        referenceRange: entry.referenceRange,
        values: entry.values,
        minScale: Math.max(0, minVal - padding),
        maxScale: maxVal + padding,
      });
    });

    return results;
  }, [events]);

  // Dynamic extraction of medication courses
  const medicationSwimlanes = useMemo(() => {
    const medMap = new Map<
      string,
      {
        name: string;
        events: Array<{
          date: string;
          dose: string;
          frequency: string;
          status: string;
          statusNote: string | null;
          eventId: string;
          isConflict: boolean;
        }>;
      }
    >();

    const conflictEventIds = new Set<string>();
    conflicts.forEach((c) => c.sides.forEach((s) => conflictEventIds.add(s.eventId)));

    events.forEach((ev) => {
      ev.medications.forEach((m) => {
        const key = m.normalizedName.toLowerCase().trim();
        if (!medMap.has(key)) {
          medMap.set(key, {
            name: m.name,
            events: [],
          });
        }
        medMap.get(key)!.events.push({
          date: ev.date || 'Undated',
          dose: m.dose || 'unspecified',
          frequency: m.frequency || '',
          status: m.status,
          statusNote: m.statusNote || null,
          eventId: ev.id,
          isConflict: conflictEventIds.has(ev.id),
        });
      });
    });

    const lanes: Array<{
      name: string;
      events: Array<{
        date: string;
        dose: string;
        frequency: string;
        status: string;
        statusNote: string | null;
        eventId: string;
        isConflict: boolean;
      }>;
      hasConflict: boolean;
      latestDose: string;
    }> = [];

    medMap.forEach((entry) => {
      entry.events.sort((a, b) => a.date.localeCompare(b.date));
      const hasConflict = entry.events.some((e) => e.isConflict);
      const latest = entry.events[entry.events.length - 1];
      lanes.push({
        name: entry.name,
        events: entry.events,
        hasConflict,
        latestDose: `${latest.dose} ${latest.frequency}`.trim(),
      });
    });

    return lanes;
  }, [events, conflicts]);

  // Plain SVG Sparkline generator
  const renderSparkline = (
    values: Array<{ date: string; val: number; displayVal: string }>,
    minScale: number,
    maxScale: number
  ) => {
    const width = 280;
    const height = 80;
    const padding = 20;

    if (values.length <= 1) {
      return (
        <div className="h-20 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg">
          Single documented value on {values[0]?.date ? formatDate(values[0].date) : 'N/A'}
        </div>
      );
    }

    const points = values.map((pt, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const divisor = maxScale - minScale === 0 ? 1 : maxScale - minScale;
      const y = height - padding - ((pt.val - minScale) / divisor) * (height - 2 * padding);
      return { x, y, val: pt.val, date: pt.date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <path d={pathD} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="4" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Pill className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Medications & Lab Trajectories
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Chronological medication courses, dosage shifts, and objective laboratory trends
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {medicationSwimlanes.length} Documented Meds
          </span>
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200">
            {labTrends.length} Lab Test Series
          </span>
        </div>
      </div>

      {/* SECTION 1: Continuous Medication Ribbon */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Medication Continuous Ribbon
          </h2>
          <p className="text-xs text-slate-500">
            Documented doses, modifications, and conflict points across time
          </p>
        </div>

        {medicationSwimlanes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              No medications documented in the uploaded records
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Prescriptions and active medications will appear here once extracted.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
            {medicationSwimlanes.map((lane, idx) => (
              <div key={idx} className="space-y-2 border-b border-slate-100 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{lane.name}</span>
                    {lane.hasConflict && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Potential Conflict Flagged
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-xs font-medium">
                    Latest: {lane.latestDose}
                  </span>
                </div>

                {/* Event blocks */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {lane.events.map((e, evIdx) => (
                    <button
                      key={evIdx}
                      onClick={() => setSelectedEventId(e.eventId)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                        e.isConflict
                          ? 'bg-amber-50 border-amber-300 hover:border-amber-400'
                          : 'bg-slate-50 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(e.date)}</span>
                        <span className="uppercase text-[9px] px-1 rounded bg-slate-200 text-slate-700">
                          {e.status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {e.dose} {e.frequency}
                      </div>
                      {e.statusNote && (
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {e.statusNote}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Laboratory Trajectories & Objective Trends */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Laboratory Trajectories & Sparklines
          </h2>
          <p className="text-xs text-slate-500">
            Sequential objective values plotted chronologically without interpretive clinical judgment
          </p>
        </div>

        {labTrends.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              No laboratory test results documented in the uploaded records
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Blood reports, metabolic panels, and pathology tests will show trends here once extracted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labTrends.map((trend, idx) => {
              const latest = trend.values[trend.values.length - 1];
              const earliest = trend.values[0];

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{trend.name}</h3>
                        <p className="text-[11px] text-slate-400">
                          Reference: {trend.referenceRange || 'Unstated in report'}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-slate-900 font-mono">
                          {latest.displayVal} <span className="text-xs font-normal text-slate-500">{trend.unit}</span>
                        </div>
                        {latest.flag && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              latest.flag === 'HIGH' || latest.flag === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Flag: {latest.flag}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sparkline Graphic */}
                    <div className="py-2">
                      {renderSparkline(trend.values, trend.minScale, trend.maxScale)}
                    </div>
                  </div>

                  {/* Sequential values table */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    {trend.values.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        onClick={() => setSelectedEventId(v.eventId)}
                        className="flex items-center justify-between text-xs hover:bg-slate-50 p-1 rounded cursor-pointer transition-colors"
                      >
                        <span className="font-mono text-slate-500 text-[11px]">
                          {formatDate(v.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">
                            {v.displayVal} {trend.unit}
                          </span>
                          {v.flag && (
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                v.flag === 'HIGH' ? 'text-rose-700' : 'text-slate-600'
                              }`}
                            >
                              {v.flag}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                            {v.doc}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
