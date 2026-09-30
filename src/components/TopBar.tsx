import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Upload,
  User,
  HelpCircle,
  Menu,
  AlertTriangle,
  LogOut,
  ChevronDown,
  UserCheck,
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
    currentUser,
    logout,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6">
      {/* Brand & Left Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
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

        {/* Demo Mode Badge on Desktop & Tablet */}
        {isDemoMode && screen !== 'landing' && screen !== 'login' && screen !== 'signup' && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            DEMO DATA — FICTIONAL PATIENT
          </div>
        )}

        {/* Live Document Analysis Mode Badge on Desktop */}
        {!isDemoMode && screen !== 'landing' && screen !== 'upload' && screen !== 'login' && screen !== 'signup' && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            DOCUMENT MODE: Real Gemini Extraction
          </div>
        )}

        {/* Active Role Indicator Badge */}
        {currentUser && screen !== 'landing' && screen !== 'login' && screen !== 'signup' && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
              currentUser.role === 'patient'
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}
          >
            {currentUser.role === 'patient' ? 'Patient Portal' : 'Doctor View'}
          </div>
        )}

        {/* Patient Chip (visible on desktop dashboard screens) */}
        {screen !== 'landing' && screen !== 'upload' && screen !== 'login' && screen !== 'signup' && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">
              {currentUser?.role === 'patient' ? `My Records: ${patientInfo.name}` : `Patient: ${patientInfo.name}`}
            </span>
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
        {conflicts.length > 0 && screen !== 'conflicts' && screen !== 'login' && screen !== 'signup' && (
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

        {/* Mode Toggles (visible when in workspace and logged in) */}
        {currentUser && screen !== 'login' && screen !== 'signup' && (
          <>
            {isDemoMode ? (
              <button
                onClick={switchToDocumentMode}
                title="Switch to Document Mode and upload real medical PDFs"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer min-h-[36px]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Documents</span>
                <span className="sm:hidden font-medium">Docs</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setScreen('upload')}
                  title="Upload more records"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                  <span className="sm:hidden">Upload</span>
                </button>

                <button
                  onClick={runDemoProcessing}
                  title="Switch to Demo Data (Synthetic Patient)"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Demo</span>
                  <span className="sm:hidden">Demo</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* USER PROFILE & LOGOUT CONTROL */}
        {currentUser ? (
          <div className="relative pl-1 sm:pl-2 border-l border-slate-200">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
              title={`Signed in as ${currentUser.name} (${currentUser.email})`}
              aria-label="User account profile menu"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs ${
                  currentUser.isDemoUser
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-teal-700 text-white'
                }`}
              >
                {currentUser.avatarInitials || 'MD'}
              </div>

              <div className="hidden lg:block text-left leading-none pr-1">
                <div className="font-semibold text-xs text-slate-800 truncate max-w-[110px]">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {currentUser.isDemoUser ? 'Demo User' : 'Physician'}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="pb-2.5 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          currentUser.isDemoUser
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-teal-700 text-white'
                        }`}
                      >
                        {currentUser.avatarInitials || 'MD'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      {currentUser.isDemoUser ? (
                        <div className="text-[10px] bg-amber-50 text-amber-900 px-2 py-1 rounded-md border border-amber-200 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Demo Access · Synthetic Patient Data</span>
                        </div>
                      ) : (
                        <div className="text-[10px] bg-emerald-50 text-emerald-900 px-2 py-1 rounded-md border border-emerald-200 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Clinical Account · Gemini PDF Enabled</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Unauthenticated state (e.g. on Landing Screen) */
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
            <button
              onClick={() => setScreen('login')}
              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
