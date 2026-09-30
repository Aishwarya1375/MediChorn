import React from 'react';
import {
  Clock,
  Pill,
  AlertTriangle,
  CalendarRange,
  FileText,
  FileCheck,
  MessageSquare,
  ChevronRight,
  LogOut,
  Upload,
  User,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { useApp, ScreenType } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { screen, setScreen, conflicts, documents, gaps, currentUser, logout } = useApp();

  const isPatient = currentUser?.role === 'patient';

  // Role-customized navigation lists matching prompt requirements
  const patientNavItems: Array<{
    id: ScreenType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'timeline',
      label: 'My Medical Timeline',
      icon: Clock,
    },
    {
      id: 'records',
      label: 'My Records',
      icon: FileText,
      badge: documents.length,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'meds_labs',
      label: 'Documented Medications',
      icon: Pill,
    },
    {
      id: 'coverage',
      label: 'Record Coverage',
      icon: CalendarRange,
      badge: gaps.length > 0 ? `${gaps.length} gaps` : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'handoff',
      label: 'Handoff Summary',
      icon: FileCheck,
    },
    {
      id: 'upload',
      label: 'Upload Records',
      icon: Upload,
    },
  ];

  const doctorNavItems: Array<{
    id: ScreenType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'records',
      label: 'Patient Records',
      icon: FileText,
      badge: documents.length,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'timeline',
      label: 'Medical Timeline',
      icon: Clock,
    },
    {
      id: 'conflicts',
      label: 'Potential Conflicts',
      icon: AlertTriangle,
      badge: conflicts.length > 0 ? conflicts.length : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    },
    {
      id: 'coverage',
      label: 'Record Coverage',
      icon: CalendarRange,
      badge: gaps.length > 0 ? `${gaps.length} gaps` : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'meds_labs',
      label: 'Medications & Labs',
      icon: Pill,
    },
    {
      id: 'handoff',
      label: 'Handoff Summary',
      icon: FileCheck,
    },
    {
      id: 'ask',
      label: 'Ask Records',
      icon: MessageSquare,
    },
  ];

  const navItems = isPatient ? patientNavItems : doctorNavItems;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white shrink-0 hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-3.5 space-y-1">
        {/* Role Mode Tag in Sidebar */}
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isPatient ? 'Patient Portal' : 'Clinician Review'}
          </span>
          <span
            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              isPatient
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}
          >
            {isPatient ? 'Patient' : 'Doctor'}
          </span>
        </div>

        {navItems.map((item) => {
          const isActive = screen === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-50/80 text-teal-900 font-semibold border border-teal-200/70 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                      item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety Notice Reminder */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
        <div className="text-[11px] text-slate-500 leading-normal flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-700 mb-0.5">
              {isPatient ? 'Personal Health Stream' : 'Longitudinal Review'}
            </p>
            <p className="text-[10px] text-slate-400">
              {isPatient
                ? 'Shows facts documented in your uploaded records. Does not provide medical advice.'
                : 'Factual care stream with verbatim evidence quotes and conflict screening.'}
            </p>
          </div>
        </div>
      </div>

      {/* User Account Card & Logout */}
      {currentUser && (
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentUser.isDemoUser
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : isPatient
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {currentUser.avatarInitials || (isPatient ? 'PT' : 'MD')}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-slate-800 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser.roleTitle || (isPatient ? 'Patient' : 'Clinician')}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
