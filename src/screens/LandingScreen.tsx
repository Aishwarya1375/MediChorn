import React from 'react';
import {
  Clock,
  Sparkles,
  Upload,
  ShieldCheck,
  Scale,
  CalendarRange,
  ArrowRight,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingScreen: React.FC = () => {
  const { setScreen, runDemoProcessing, switchToDocumentMode } = useApp();

  return (
    <div className="min-h-full flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Deterministic & Multimodal Medical Organization
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Turn scattered medical records into{' '}
            <span className="text-teal-700 underline decoration-teal-300 decoration-wavy decoration-2">
              one clear timeline.
            </span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            From scattered PDFs, prescriptions, and lab reports to an explainable care history.
            Every clinical event is linked to its exact verbatim source evidence.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={switchToDocumentMode}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[48px]"
            >
              <Upload className="w-5 h-5" />
              <span>UPLOAD RECORDS</span>
            </button>

            <button
              onClick={runDemoProcessing}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs hover:border-slate-400 transition-all flex items-center justify-center gap-2 group min-h-[48px]"
            >
              <Sparkles className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              <span>TRY DEMO</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Zero network dependence in Demo Mode. Evaluates pre-extracted records in 4 seconds.
          </p>
        </div>

        {/* 5-Step Workflow */}
        <div className="mt-14 sm:mt-16 pt-10 sm:pt-12 border-t border-slate-200">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              The MediChron Verification Workflow
            </h2>
          </div>

          {/* Mobile Vertical Stack (with connecting downward arrows) */}
          <div className="md:hidden space-y-2 max-w-sm mx-auto">
            {[
              {
                step: '01',
                title: 'SCATTERED RECORDS',
                desc: 'Upload notes, labs, discharge summaries, prescriptions.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'AI EXTRACTION',
                desc: 'Gemini Flash extracts explicit medical events & verbatim quotes.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'TIMELINE',
                desc: 'Normalized dates arranged with inline gap detection.',
                icon: Clock,
              },
              {
                step: '04',
                title: 'EVIDENCE',
                desc: 'Tap any event to review source document proof & citations.',
                icon: ShieldCheck,
              },
              {
                step: '05',
                title: 'HANDOFF',
                desc: 'Generate factual summaries with exact citation chips.',
                icon: FileCheck,
              },
            ].map((item, idx, arr) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3 text-left">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-xs tracking-tight">
                          {item.title}
                        </h3>
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {item.step}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="flex justify-center my-0.5 text-teal-600 font-bold text-sm">
                      ↓
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Desktop 5-Column Grid */}
          <div className="hidden md:grid md:grid-cols-5 gap-3 sm:gap-4 relative">
            {[
              {
                step: '01',
                title: 'Scattered Records',
                desc: 'Upload notes, labs, discharge summaries, prescriptions.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'AI Extraction',
                desc: 'Gemini Flash extracts explicit medical events & quotes.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Chronological Timeline',
                desc: 'Normalized dates arranged with inline gap detection.',
                icon: Clock,
              },
              {
                step: '04',
                title: 'Verbatim Proof',
                desc: 'Click any event to highlight source document proof.',
                icon: ShieldCheck,
              },
              {
                step: '05',
                title: 'Sourced Handoff',
                desc: 'Generate factual summaries with exact citation chips.',
                icon: FileCheck,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-300">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Timeline Preview Strip (Non-interactive preview with gap marker & quote) */}
        <div className="mt-16 bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Interactive Preview
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Live Timeline Architecture Preview
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                10 Documents · Feb – Aug 2025
              </span>
              <button
                onClick={runDemoProcessing}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 underline"
              >
                Launch Full Timeline →
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Event Preview 1: Visit */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      12 Feb 2025
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Visit
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mt-0.5">
                    Consultation with Dr. Meera Iyer (Lakeview Family Clinic)
                  </h4>
                  <p className="font-serif-doc text-xs text-slate-600 italic mt-1 border-l-2 border-teal-600 pl-2">
                    &quot;Chief complaints: Increased thirst, frequent urination and tiredness for about 3 weeks. Vitals: BP 148/92 mmHg.&quot;
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                D1_Consultation_Note · p.1
              </span>
            </div>

            {/* Event Preview 2: Metformin Dose Change (Conflict Trigger) */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      07 Apr 2025
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      Medication Changed
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      Potential Conflict Flagged
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mt-0.5">
                    Metformin dose increased to 1000 mg twice daily
                  </h4>
                  <p className="font-serif-doc text-xs text-slate-700 italic mt-1 border-l-2 border-amber-500 pl-2">
                    &quot;Metformin dose increased to 1000 mg twice daily.&quot;
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                D7_FollowUp_Note · p.1
              </span>
            </div>

            {/* Gap Preview: Hatched Marker */}
            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-hatched-gap flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800">
                  No uploaded records found for this period
                </span>
                <span className="text-slate-500">· 115 days (27 Apr – 18 Aug 2025)</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline italic">
                Does not mean care did not occur
              </span>
            </div>
          </div>
        </div>

        {/* 3 Trust Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Evidence-Linked</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Every date, diagnosis, dose, and lab is tethered to its source document and page with a verbatim quote. Zero ungrounded assertions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Conflict-Aware</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Identifies discrepancies between documents (such as differing medication doses) side by side without artificially picking a winner.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <CalendarRange className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Gap-Aware</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Explicitly visualizes spans without uploaded documentation, clearly distinguishing missing records from absent healthcare.
            </p>
          </div>
        </div>

        {/* Safety Strip */}
        <div className="mt-12 p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Clinical Boundary: </span>
          Organizes records. Never diagnoses, prescribes, predicts, or recommends medical treatment.
        </div>
      </div>
    </div>
  );
};
