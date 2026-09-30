import React, { useMemo } from 'react';
import {
  FileText,
  Clock,
  Activity,
  Pill,
  AlertTriangle,
  CalendarRange,
  Search,
  Filter,
  CheckCircle2,
  Flag,
  ChevronRight,
  ExternalLink,
  Shield,
  X,
  Stethoscope,
  FlaskConical,
  HeartPulse,
  ClipboardList,
  Sparkles,
  Upload,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getMonthKey, formatMonthHeader, parseIsoDate } from '../lib/dates';
import { TimelineEvent, EventType } from '../types';

export const TimelineDashboard: React.FC = () => {
  const {
    events,
    documents,
    conflicts,
    gaps,
    stats,
    selectedEventId,
    setSelectedEventId,
    setSourceViewerState,
    setScreen,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    providerFilter,
    setProviderFilter,
    filterConflictsOnly,
    setFilterConflictsOnly,
    filterLowConfidence,
    setFilterLowConfidence,
    filterUnreviewedOnly,
    setFilterUnreviewedOnly,
    isSafetyNoticeDismissed,
    dismissSafetyNotice,
    patientIssues,
    isPatientWarningDismissed,
    dismissPatientWarning,
    isDemoMode,
    runDemoProcessing,
    currentUser,
    doctorPatients,
    activePatientId,
    selectDoctorPatient,
  } = useApp();

  const isPatient = currentUser?.role === 'patient';

  // Distinct providers for filter
  const providers = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.provider) set.add(e.provider);
      if (e.facility) set.add(e.facility);
    });
    return Array.from(set);
  }, [events]);

  // Conflict event IDs
  const conflictEventIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach((c) => c.sides.forEach((s) => ids.add(s.eventId)));
    return ids;
  }, [conflicts]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Category filter
      if (categoryFilter !== 'all' && ev.eventType !== categoryFilter) {
        return false;
      }

      // Provider/facility filter
      if (providerFilter !== 'all') {
        const matchesProv = ev.provider === providerFilter || ev.facility === providerFilter;
        if (!matchesProv) return false;
      }

      // Conflicts only
      if (filterConflictsOnly && !conflictEventIds.has(ev.id)) {
        return false;
      }

      // Confidence below high (< 0.85)
      if (filterLowConfidence && ev.confidence >= 0.85) {
        return false;
      }

      // Unreviewed only
      if (filterUnreviewedOnly && ev.review.state !== 'unreviewed') {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = ev.title.toLowerCase().includes(q);
        const inNotes = (ev.notes || '').toLowerCase().includes(q);
        const inEvidence = (ev.evidenceText || '').toLowerCase().includes(q);
        const inDiag = ev.diagnoses.some((d) => d.text.toLowerCase().includes(q));
        const inMeds = ev.medications.some(
          (m) => m.name.toLowerCase().includes(q) || m.normalizedName.toLowerCase().includes(q)
        );
        const inTests = ev.tests.some(
          (t) => t.name.toLowerCase().includes(q) || t.normalizedName.toLowerCase().includes(q)
        );
        if (!inTitle && !inNotes && !inEvidence && !inDiag && !inMeds && !inTests) {
          return false;
        }
      }

      return true;
    });
  }, [
    events,
    categoryFilter,
    providerFilter,
    filterConflictsOnly,
    filterLowConfidence,
    filterUnreviewedOnly,
    searchTerm,
    conflictEventIds,
  ]);

  // Group events by month
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    const undated: TimelineEvent[] = [];

    filteredEvents.forEach((ev) => {
      if (!ev.date || ev.datePrecision === 'unknown') {
        undated.push(ev);
      } else {
        const monthKey = getMonthKey(ev.date);
        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(ev);
      }
    });

    const sortedMonthKeys = Object.keys(groups).sort();
    return { sortedMonthKeys, groups, undated };
  }, [filteredEvents]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: events.length,
      visit: 0,
      test: 0,
      diagnosis: 0,
      medication: 0,
      treatment: 0,
      follow_up: 0,
    };
    events.forEach((e) => {
      if (counts[e.eventType] !== undefined) counts[e.eventType]++;
    });
    return counts;
  }, [events]);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'visit':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'test':
        return <FlaskConical className="w-4 h-4 text-teal-600" />;
      case 'diagnosis':
        return <HeartPulse className="w-4 h-4 text-indigo-600" />;
      case 'medication':
        return <Pill className="w-4 h-4 text-amber-600" />;
      case 'treatment':
        return <Stethoscope className="w-4 h-4 text-emerald-600" />;
      case 'follow_up':
        return <ClipboardList className="w-4 h-4 text-slate-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventBorderAndBg = (type: EventType, isConflict: boolean) => {
    if (isConflict) {
      return 'border-amber-300 bg-amber-50/30 hover:border-amber-400';
    }
    switch (type) {
      case 'visit':
        return 'border-slate-200/90 hover:border-blue-300 bg-white';
      case 'test':
        return 'border-slate-200/90 hover:border-teal-300 bg-white';
      case 'diagnosis':
        return 'border-slate-200/90 hover:border-indigo-300 bg-white';
      case 'medication':
        return 'border-slate-200/90 hover:border-amber-300 bg-white';
      case 'treatment':
        return 'border-slate-200/90 hover:border-emerald-300 bg-white';
      case 'follow_up':
        return 'border-slate-200/90 hover:border-slate-400 bg-white';
      default:
        return 'border-slate-200 hover:border-slate-300 bg-white';
    }
  };

  // If no events at all in Document Mode
  if (events.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isDemoMode
              ? 'No demo events loaded.'
              : 'No medical events found in uploaded document(s)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            {isDemoMode
              ? 'Click below to load the synthetic Ananya Rao clinical dataset.'
              : 'Gemini analyzed the uploaded file but found no medical records, encounters, diagnoses, medications, or test results.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setScreen('upload')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Upload Medical Documents
          </button>
          <button
            onClick={runDemoProcessing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Try Demo Data (Synthetic)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Mode Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {isDemoMode ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              DEMO DATA — FICTIONAL PATIENT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DOCUMENT MODE: Live Gemini Extraction ({documents.length} File{documents.length > 1 ? 's' : ''})
            </span>
          )}
          <span className="text-xs text-slate-500 hidden md:inline">
            {isPatient
              ? 'Personal Health Stream: View chronological events documented in your records'
              : isDemoMode
              ? 'Clinician View: Evaluating 10 synthetic documents with instant offline timeline'
              : 'Clinician View: Derived solely from uploaded PDF records'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode ? (
            <button
              onClick={() => setScreen('upload')}
              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Records</span>
            </button>
          ) : (
            <button
              onClick={runDemoProcessing}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Switch to Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Specific Portal Header */}
      {isPatient ? (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 mb-1">
                <span>Patient Dashboard</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                My Medical Timeline
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Every encounter, lab result, and prescription <span className="font-semibold text-slate-800">documented in your uploaded records</span>, organized into a clear chronological care history.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setScreen('handoff')}
                className="px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-teal-700" />
                <span>Handoff Summary & PDF</span>
              </button>
              <button
                onClick={() => setScreen('upload')}
                className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Records</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
            <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-700">Documented in your uploaded records: </strong>
              MediChron strictly organizes facts directly quoted from your provided documents. It never gives medical advice, clinical diagnoses, or treatment recommendations. Always consult your doctor for medical decisions.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 mb-1">
                <span>Clinician Workspace</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Medical Timeline
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Multi-document synthesis with verbatim quotes, diagnostic certainty, and potential discrepancy detection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setScreen('handoff')}
                className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Handoff Summary & PDF</span>
              </button>
              <button
                onClick={() => setScreen('records')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Patient Records</span>
              </button>
              <button
                onClick={() => setScreen('upload')}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Records</span>
              </button>
            </div>
          </div>

          {/* Clinician Active Patient Switcher (MongoDB Atlas Integration) */}
          {doctorPatients.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Select Patient:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {doctorPatients.map((p) => {
                    const isSelected = activePatientId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectDoctorPatient(p.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{p.name}</span>
                        {p.documentsCount > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {p.documentsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>MongoDB Patient Care Records</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patient Discrepancy Warning Banner */}
      {patientIssues.length > 0 && !isPatientWarningDismissed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start justify-between shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Patient Consistency Notice: </span>
              Documents may belong to different individuals or have varied naming formats. Review before relying on this timeline:
              <ul className="list-disc pl-4 mt-1 space-y-0.5 font-medium">
                {patientIssues[0].values.map((v, i) => (
                  <li key={i}>
                    {v.documentName}: <span className="font-bold">&quot;{v.value}&quot;</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={dismissPatientWarning}
            className="text-amber-700 hover:text-amber-950 p-1 cursor-pointer"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Documents */}
        <div
          onClick={() => setScreen('records')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-teal-700">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Records</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.totalDocuments}</span>
            <span className="text-xs text-slate-500">docs</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Uploaded files</p>
        </div>

        {/* Clinical Events */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <Clock className="w-4 h-4 text-teal-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Events</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.totalEvents}</span>
            <span className="text-xs text-slate-500">total</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Normalized timeline</p>
        </div>

        {/* Diagnoses */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <HeartPulse className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnoses</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.totalDiagnoses}</span>
            <span className="text-xs text-slate-500">coded</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Explicit & suspected</p>
        </div>

        {/* Medications */}
        <div
          onClick={() => setScreen('meds_labs')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-600">
            <Pill className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Meds</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.totalMedications}</span>
            <span className="text-xs text-slate-500">active</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">View continuous ribbon</p>
        </div>

        {/* Potential Conflicts */}
        <div
          onClick={() => setScreen('conflicts')}
          className={`p-3.5 rounded-xl border shadow-2xs transition-all cursor-pointer group ${
            conflicts.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Conflicts</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-950">{conflicts.length}</span>
            <span className="text-xs text-amber-800">flagged</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1 truncate">Review discrepancies</p>
        </div>

        {/* Record Gaps */}
        <div
          onClick={() => setScreen('coverage')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-teal-700">
            <CalendarRange className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gaps</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{gaps.length}</span>
            <span className="text-xs text-slate-500">periods</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">&gt; 45d unrecorded</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search diagnoses, medications, lab values, symptoms, verbatim text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Toggle Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {conflicts.length > 0 && (
              <button
                onClick={() => setFilterConflictsOnly(!filterConflictsOnly)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  filterConflictsOnly
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Conflicts only ({conflicts.length})</span>
              </button>
            )}

            <button
              onClick={() => setFilterLowConfidence(!filterLowConfidence)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                filterLowConfidence
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Confidence &lt; 85%</span>
            </button>

            {/* Provider Filter */}
            {providers.length > 0 && (
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="all">All Providers / Facilities</option>
                {providers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Category Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
            Category:
          </span>
          {[
            { id: 'all', label: 'All Events', count: categoryCounts.all },
            { id: 'visit', label: 'Visits', count: categoryCounts.visit },
            { id: 'test', label: 'Tests & Labs', count: categoryCounts.test },
            { id: 'diagnosis', label: 'Diagnoses', count: categoryCounts.diagnosis },
            { id: 'medication', label: 'Medications', count: categoryCounts.medication },
            { id: 'treatment', label: 'Treatments', count: categoryCounts.treatment },
            { id: 'follow_up', label: 'Follow-ups', count: categoryCounts.follow_up },
          ].map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-bold px-1 rounded-full ${
                    isSelected ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chronological Stream */}
      <div className="space-y-8">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No events match your filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or clearing active filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setProviderFilter('all');
                setFilterConflictsOnly(false);
                setFilterLowConfidence(false);
                setFilterUnreviewedOnly(false);
              }}
              className="mt-4 px-4 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold hover:bg-teal-100 cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          groupedEvents.sortedMonthKeys.map((monthKey, monthIdx) => {
            const monthEvents = groupedEvents.groups[monthKey];

            // Find any dynamically computed gap that begins in or immediately follows this month
            const matchingGaps = gaps.filter((g) => {
              const gapStartMonth = g.startDate.slice(0, 7);
              return gapStartMonth === monthKey;
            });

            return (
              <div key={monthKey} className="space-y-3">
                {/* Sticky Month Header */}
                <div className="sticky top-14 sm:top-16 z-20 py-2 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      {formatMonthHeader(monthKey)}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {monthEvents.length} documented event{monthEvents.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Event Cards in this Month */}
                <div className="space-y-3">
                  {monthEvents.map((ev) => {
                    const isConflict = conflictEventIds.has(ev.id);
                    const isSelected = selectedEventId === ev.id;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs group ${getEventBorderAndBg(
                          ev.eventType,
                          isConflict
                        )} ${
                          isSelected ? 'ring-2 ring-teal-600 shadow-md' : 'hover:shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                              {getEventIcon(ev.eventType)}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800">
                                {formatDate(ev.date, ev.datePrecision)}
                              </span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {ev.eventType.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Conflict Badge */}
                            {isConflict && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Potential conflict
                              </span>
                            )}

                            {/* Review State Badge */}
                            {ev.review.state === 'confirmed' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                              </span>
                            )}
                            {ev.review.state === 'flagged' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                <Flag className="w-3 h-3" /> Flagged
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Corroborated Badge */}
                            {ev.corroboratedBy && ev.corroboratedBy.length > 0 && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                Corroborated by {ev.corroboratedBy.length + 1} records
                              </span>
                            )}

                            {/* Confidence Chip */}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                ev.confidence >= 0.85
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : ev.confidence >= 0.6
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {Math.round(ev.confidence * 100)}% conf
                            </span>
                          </div>
                        </div>

                        {/* Title & Key Info */}
                        <div className="pl-9">
                          <h3 className="font-semibold text-sm text-slate-900 group-hover:text-teal-900 transition-colors">
                            {ev.title}
                          </h3>

                          {/* 1-2 Line Key Details */}
                          {ev.medications.length > 0 && (
                            <p className="text-xs text-slate-600 mt-1">
                              Documented dose:{' '}
                              <span className="font-semibold text-slate-800">
                                {ev.medications[0].dose || 'unspecified'} ({ev.medications[0].frequency || ''})
                              </span>
                              {ev.medications[0].statusNote && ` · ${ev.medications[0].statusNote}`}
                            </p>
                          )}

                          {ev.tests.length > 0 && ev.tests[0].resultValue && (
                            <p className="text-xs text-slate-600 mt-1 font-mono">
                              Documented value:{' '}
                              <span className="font-bold text-slate-900">
                                {ev.tests[0].resultValue} {ev.tests[0].unit || ''}
                              </span>
                              {ev.tests[0].reportFlag && (
                                <span className="ml-2 font-sans font-bold text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                                  Report flag: {ev.tests[0].reportFlag}
                                </span>
                              )}
                            </p>
                          )}

                          {ev.diagnoses.length > 0 && (
                            <p className="text-xs text-slate-600 mt-1">
                              Certainty:{' '}
                              <span className="font-semibold uppercase text-slate-800">
                                {ev.diagnoses[0].certainty}
                              </span>
                            </p>
                          )}

                          {/* Verbatim quote teaser */}
                          {ev.evidenceText && (
                            <blockquote className="font-serif-doc text-xs text-slate-500 italic mt-1.5 border-l-2 border-slate-300 pl-2 line-clamp-1 group-hover:border-teal-500 group-hover:text-slate-700 transition-colors">
                              &quot;{ev.evidenceText}&quot;
                            </blockquote>
                          )}

                          {/* Bottom Source Record Chip */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-mono truncate">
                              Source: {ev.sourceDocument} · p.{ev.sourcePage ?? 1}
                            </span>
                            <span className="text-teal-700 font-semibold group-hover:underline flex items-center gap-0.5">
                              View Proof <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DYNAMIC GAP MARKER (Derived purely from computed gaps) */}
                {matchingGaps.map((gap) => (
                  <div
                    key={gap.id}
                    onClick={() => setScreen('coverage')}
                    className="p-4 rounded-xl border border-dashed border-slate-300 bg-hatched-gap hover:border-slate-400 cursor-pointer transition-all shadow-2xs my-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/90 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0">
                          <CalendarRange className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-800">
                            No uploaded records found for this period · {gap.days} days ({formatDate(gap.startDate)} – {formatDate(gap.endDate)})
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Care may have occurred elsewhere. This tool only reflects uploaded documentation.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 self-end sm:self-center">
                        <span>Coverage Analysis</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}

        {/* Undated Events Section */}
        {groupedEvents.undated.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                Undated Records ({groupedEvents.undated.length})
              </h2>
              <span className="text-xs text-slate-400">
                Preserved without invented or guessed dates (Principle P1 & P2)
              </span>
            </div>

            <div className="space-y-3">
              {groupedEvents.undated.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:border-slate-400 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{ev.title}</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                      Date unknown
                    </span>
                  </div>
                  {ev.evidenceText && (
                    <blockquote className="font-serif-doc text-xs text-slate-500 italic mt-1 pl-2 border-l-2 border-slate-300">
                      &quot;{ev.evidenceText}&quot;
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
