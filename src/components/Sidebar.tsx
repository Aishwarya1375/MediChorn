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
} from 'lucide-react';
import { useApp, ScreenType } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { screen, setScreen, conflicts, documents, gaps } = useApp();

  const navItems: Array<{
    id: ScreenType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
    },
    {
      id: 'meds_labs',
      label: 'Meds & Labs',
      icon: Pill,
    },
    {
      id: 'conflicts',
      label: 'Potential Conflicts',
      icon: AlertTriangle,
      badge: conflicts.length,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'coverage',
      label: 'Record Coverage',
      icon: CalendarRange,
      badge: gaps.length > 0 ? `${gaps.length} gap` : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'records',
      label: 'Documents',
      icon: FileText,
      badge: documents.length,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
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

  return (
    <aside className="w-64 border-r border-slate-200 bg-white shrink-0 hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-3.5 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = screen === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
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

      {/* Cautious notice reminder */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="text-[11px] text-slate-500 leading-normal">
          <p className="font-semibold text-slate-700 mb-0.5">Cautious Organization</p>
          Organizes facts from uploaded documents with verbatim evidence quotes.
        </div>
      </div>
    </aside>
  );
};
