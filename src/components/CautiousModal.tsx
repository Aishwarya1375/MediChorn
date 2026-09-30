import React from 'react';
import { X, ShieldCheck, AlertCircle, FileSearch, Scale, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CautiousModal: React.FC = () => {
  const { isCautiousModalOpen, setIsCautiousModalOpen } = useApp();

  if (!isCautiousModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cautious-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cautious-modal-title" className="text-lg font-semibold text-slate-900">
                How MediChron Stays Cautious by Design
              </h2>
              <p className="text-xs text-slate-500">
                Our strict principles for medical record organization and explainability
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCautiousModalOpen(false)}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 leading-relaxed">
          <div className="flex gap-4">
            <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-blue-50 text-blue-700">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">P1. Zero Hallucination Guarantee</h3>
              <p className="mt-1 text-slate-600">
                MediChron never invents dates, diagnoses, medications, doses, lab values, providers, or clinical relationships. Every fact is extracted directly from uploaded records.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">P2. Preservation of Uncertainty</h3>
              <p className="mt-1 text-slate-600">
                Speculative phrases like <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 text-xs">?Type 2 diabetes</code>, &quot;suspected&quot;, or &quot;rule out&quot; are strictly classified as <span className="font-medium text-amber-700">suspected</span>. Negated findings (&quot;no chest pain&quot;, &quot;no new complaints&quot;) are never converted into symptoms.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">P3. Explicit Facts vs. Inferred Links</h3>
              <p className="mt-1 text-slate-600">
                Every event carries an <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 text-xs">evidenceBasis</code> badge (Explicit, Inferred, or Uncertain). MediChron never links a symptom to a drug or cause unless the record itself explicitly makes that connection.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-amber-50 text-amber-700">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">P4. Neutral Conflict Presentation</h3>
              <p className="mt-1 text-slate-600">
                When documents disagree (such as differing medication doses or report dates), MediChron presents both records side by side with verbatim quotes. It never decides which record is correct.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">P5. Zero Clinical Interpretation</h3>
              <p className="mt-1 text-slate-600">
                The platform bans subjective adjectives like &quot;improved&quot;, &quot;worsened&quot;, &quot;abnormal&quot;, &quot;likely&quot;, &quot;concerning&quot;, or &quot;missed follow-up&quot;. Lab flags are shown only if the source laboratory printed that flag (e.g. &quot;Report flag: HIGH&quot;).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 text-teal-900 text-xs">
            <span className="font-semibold">Medical Safety Disclaimer:</span> MediChron AI is an organization and timeline visualization tool. It does not provide medical advice, diagnosis, prognosis, or treatment recommendations.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={() => setIsCautiousModalOpen(false)}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
