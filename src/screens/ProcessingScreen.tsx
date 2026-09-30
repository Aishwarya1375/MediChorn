import React from 'react';
import {
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProcessingScreen: React.FC = () => {
  const {
    processingStage,
    processedDocsCount,
    totalDocsToProcess,
    isDemoMode,
    processingError,
    loadDemoData,
    setScreen,
  } = useApp();

  const stages = [
    { id: 1, title: 'Reading documents', desc: 'Parsing digital and scanned clinical pages' },
    { id: 2, title: 'Extracting events', desc: 'Detecting visits, tests, diagnoses, and medications' },
    { id: 3, title: 'Linking evidence', desc: 'Attaching verbatim quotes and document page citations' },
    { id: 4, title: 'Checking conflicts', desc: 'Screening for dosage conflicts and record gaps' },
    { id: 5, title: 'Building timeline', desc: 'Constructing unified, explainable care stream' },
  ];

  const estimatedEvents = Math.min(35, Math.max(4, processedDocsCount * 4));

  if (processingError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Document Analysis Failed
          </h1>
          <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 mt-3 leading-relaxed">
            {processingError}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Please verify the uploaded file is not password-protected and contains medical records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setScreen('upload')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors min-h-[44px]"
          >
            Upload Different Document
          </button>
          <button
            onClick={loadDemoData}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Try Demo Data Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 border border-teal-200 shadow-2xs">
          <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight uppercase">
          ANALYZING YOUR RECORDS
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isDemoMode
            ? 'Analyzing synthetic clinical records with zero network latency'
            : 'Gemini 3.8 Flash multimodal structured extraction in progress'}
        </p>

        {/* Live Counter Badges */}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            {processedDocsCount} of {totalDocsToProcess} Documents Processed
          </span>
          <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-800">
            ~{estimatedEvents} Clinical Events Extracted
          </span>
        </div>
      </div>

      {/* Stepper Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 mb-6">
        <div className="space-y-4 sm:space-y-5">
          {stages.map((stage) => {
            const isCompleted = processingStage > stage.id;
            const isCurrent = processingStage === stage.id;
            const isPending = processingStage < stage.id;

            return (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-bold font-mono">
                      {stage.id}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isCurrent
                          ? 'text-teal-900 font-bold'
                          : isCompleted
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.title}
                    </h2>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 animate-pulse ml-2 shrink-0">
                        In Progress
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ml-2 shrink-0">
                        Done
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isCurrent || isCompleted ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
