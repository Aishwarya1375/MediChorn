import React from 'react';
import { Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setIsCautiousModalOpen } = useApp();

  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/80 backdrop-blur-xs py-3 px-4 text-center text-xs text-slate-500 no-print z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <p className="text-[11px] sm:text-xs text-slate-600">
            Organizes uploaded records for review. Not medical advice. Does not diagnose, prescribe, or recommend treatment.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <button
            onClick={() => setIsCautiousModalOpen(true)}
            className="text-teal-700 hover:text-teal-800 hover:underline font-medium"
          >
            How MediChron stays cautious
          </button>
          <span>·</span>
          <span>MediChron AI v1.0</span>
        </div>
      </div>
    </footer>
  );
};
