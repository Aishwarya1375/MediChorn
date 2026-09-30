import React from 'react';
import {
  X,
  Home,
  Clock,
  FileText,
  AlertTriangle,
  Pill,
  CalendarRange,
  FileCheck,
  MessageSquare,
  Shield,
  Sparkles,
  Upload,
  User,
  ChevronRight,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useApp, ScreenType } from '../context/AppContext';

export const MobileMenuDrawer: React.FC = () => {
  const {
    screen,
    setScreen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDemoMode,
    runDemoProcessing,
    switchToDocumentMode,
    patientInfo,
    conflicts,
    documents,
    gaps,
    setIsCautiousModalOpen,
    currentUser,
    logout,
  } = useApp();

  if (!isMobileMenuOpen) return null;

  const navigateTo = (scr: ScreenType) => {
    setScreen(scr);
    setIsMobileMenuOpen(false);
  };

  const isPatient = currentUser?.role === 'patient';

  const patientNavItems: Array<{
    id: ScreenType;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'timeline',
      label: 'My Medical Timeline',
      desc: 'Chronological events documented in your records',
      icon: Clock,
    },
    {
      id: 'records',
      label: 'My Records',
      desc: 'Uploaded medical documents and status',
      icon: FileText,
      badge: documents.length,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'meds_labs',
      label: 'Documented Medications',
      desc: 'Prescriptions and lab results from records',
      icon: Pill,
    },
    {
      id: 'coverage',
      label: 'Record Coverage',
      desc: 'Documented intervals and record continuity',
      icon: CalendarRange,
      badge: gaps.length > 0 ? `${gaps.length} gaps` : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'handoff',
      label: 'Handoff Summary',
      desc: 'Summary of documented care for sharing with clinicians',
      icon: FileCheck,
    },
    {
      id: 'upload',
      label: 'Upload Records',
      desc: 'Add more PDFs or medical images',
      icon: Upload,
    },
  ];

  const doctorNavItems: Array<{
    id: ScreenType;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'records',
      label: 'Patient Records',
      desc: 'Source records, page counts & extraction status',
      icon: FileText,
      badge: documents.length,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'timeline',
      label: 'Medical Timeline',
      desc: 'All medical visits, tests, and prescriptions',
      icon: Clock,
    },
    {
      id: 'conflicts',
      label: 'Potential Conflicts',
      desc: 'Neutral side-by-side discrepancy review',
      icon: AlertTriangle,
      badge: conflicts.length > 0 ? conflicts.length : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    },
    {
      id: 'coverage',
      label: 'Record Coverage & Gaps',
      desc: 'Unrecorded period indicators and open loops',
      icon: CalendarRange,
      badge: gaps.length > 0 ? `${gaps.length} gaps` : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'meds_labs',
      label: 'Medications & Labs',
      desc: 'Continuous medication ribbons and lab sparklines',
      icon: Pill,
    },
    {
      id: 'handoff',
      label: 'Sourced Handoff Summary',
      desc: 'Structured report with verbatim proof chips',
      icon: FileCheck,
    },
    {
      id: 'ask',
      label: 'Ask the Records',
      desc: 'Factual Q&A bounded strictly to documented facts',
      icon: MessageSquare,
    },
  ];

  const navItems = isPatient ? patientNavItems : doctorNavItems;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
      className="md:hidden fixed inset-0 z-50 flex"
    >
      {/* Dark backdrop overlay */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over menu panel */}
      <div className="relative w-5/6 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="mobile-menu-title" className="font-bold text-sm text-slate-900 leading-none">
                MediChron <span className="text-teal-700 font-semibold text-xs">AI</span>
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Medical Timeline & Proof</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Header */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    currentUser.isDemoUser
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-teal-700 text-white'
                  }`}
                >
                  {currentUser.avatarInitials || 'MD'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                  currentUser.isDemoUser
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : currentUser.role === 'patient'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {currentUser.isDemoUser
                  ? currentUser.role === 'patient'
                    ? 'Demo Patient'
                    : 'Demo Doctor'
                  : currentUser.role === 'patient'
                  ? 'Patient'
                  : 'Doctor'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('login')}
                className="flex-1 py-1.5 rounded-lg bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => navigateTo('signup')}
                className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs text-center cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Patient / Mode Banner */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 truncate">{patientInfo.name}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 text-[11px] truncate">{patientInfo.ageOrDob}</span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                switchToDocumentMode();
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                !isDemoMode
                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Upload className="w-3.5 h-3.5" />
                <span>My Docs</span>
              </div>
              <p className="text-[10px] opacity-80 font-normal">Real PDF Mode</p>
            </button>

            <button
              onClick={() => {
                runDemoProcessing();
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Try Demo</span>
              </div>
              <p className="text-[10px] opacity-80 font-normal">Fictional Data</p>
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Primary Sections
          </div>

          <button
            onClick={() => navigateTo('landing')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
              screen === 'landing'
                ? 'bg-teal-50 text-teal-900 font-semibold border border-teal-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 text-slate-400" />
              <span>Overview & Landing</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {navItems.map((item) => {
            const isActive = screen === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate text-slate-900">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions in Drawer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsCautiousModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-teal-700" />
            <span>Safety Rules & Verification Principles</span>
          </button>

          {currentUser && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-700 font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out ({currentUser.name.split(' ')[0]})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
