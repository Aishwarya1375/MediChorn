import React from 'react';
import {
  Clock,
  Sparkles,
  Upload,
  User,
  HelpCircle,
  Menu,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TopBar: React.FC = () => {
  const {
    screen,
    setScreen,
    isDemoMode,
    patientInfo,
    liveAiAvailable,
    runDemoProcessing,
    switchToDocumentMode,
    setIsCautiousModalOpen,
    setIsMobileMenuOpen,
    conflicts,
  } = useApp();

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6">
      {/* Brand & Left Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Mobile Menu Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center relative"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
          {conflicts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        {/* Brand */}
        <button
          onClick={() => setScreen('landing')}
          className="flex items-center gap-2 text-left group cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-800 transition-colors">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base leading-none">
                MediChron
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block mt-0.5">
              Explainable Care Timeline
            </p>
          </div>
        </button>

        {/* Status Indicator (Mobile + Desktop) */}
        <div
          title={
            liveAiAvailable
              ? 'Gemini 3.8 Flash active server-side for native PDF extraction and structured clinical JSON.'
              : 'Local Demo Engine active.'
          }
          className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] sm:text-[11px] font-medium text-slate-600"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              liveAiAvailable ? 'bg-emerald-500' : 'bg-teal-500'
            }`}
          />
          <span className="hidden sm:inline">
            {liveAiAvailable ? 'Gemini 3.8 Flash' : 'Deterministic Mode'}
          </span>
          <span className="sm:hidden font-mono text-[9px]">
            {liveAiAvailable ? 'AI' : 'Demo'}
          </span>
        </div>

        {/* Demo Mode Badge on Desktop */}
        {isDemoMode && screen !== 'landing' && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            DEMO DATA: Ananya Rao (Fictional)
          </div>
        )}

        {/* Live Document Analysis Mode Badge on Desktop */}
        {!isDemoMode && screen !== 'landing' && screen !== 'upload' && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            DOCUMENT MODE: Real Gemini Extraction
          </div>
        )}

        {/* Patient Chip (visible on desktop dashboard screens) */}
        {screen !== 'landing' && screen !== 'upload' && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">{patientInfo.name}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">{patientInfo.ageOrDob}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-[11px] text-slate-500">{patientInfo.id}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile Alerts quick indicator button if there are conflicts */}
        {conflicts.length > 0 && screen !== 'conflicts' && (
          <button
            onClick={() => setScreen('conflicts')}
            className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold"
            aria-label={`${conflicts.length} conflicts`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{conflicts.length}</span>
          </button>
        )}

        {/* Cautious Rules Button */}
        <button
          onClick={() => setIsCautiousModalOpen(true)}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
          title="Review how MediChron prevents hallucinations and preserves medical uncertainty"
          aria-label="Safety Rules"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span className="hidden xl:inline">Safety Rules</span>
        </button>

        {/* Mode Toggles */}
        {isDemoMode ? (
          <button
            onClick={switchToDocumentMode}
            title="Switch to Document Mode and upload real medical PDFs"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer min-h-[36px]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch to My Documents</span>
            <span className="sm:hidden font-medium">Upload Docs</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setScreen('upload')}
              title="Upload more records"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Records</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              onClick={runDemoProcessing}
              title="Switch to Demo Data (Synthetic Patient)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Try Demo Data</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
