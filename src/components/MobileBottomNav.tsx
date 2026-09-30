import React from 'react';
import {
  Home,
  Clock,
  FileText,
  AlertTriangle,
  Upload,
  Menu,
} from 'lucide-react';
import { useApp, ScreenType } from '../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const {
    screen,
    setScreen,
    documents,
    conflicts,
    currentUser,
    setIsMobileMenuOpen,
  } = useApp();

  // Don't show bottom nav during active processing, login, or signup screens
  if (screen === 'processing' || screen === 'login' || screen === 'signup') return null;

  const isPatient = currentUser?.role === 'patient';

  const tabs: Array<{
    id: ScreenType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'landing',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'timeline',
      label: isPatient ? 'My Timeline' : 'Timeline',
      icon: Clock,
    },
    {
      id: 'records',
      label: isPatient ? 'My Records' : 'Records',
      icon: FileText,
      badge: documents.length,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
    isPatient
      ? {
          id: 'upload',
          label: 'Upload',
          icon: Upload,
        }
      : {
          id: 'conflicts',
          label: 'Alerts',
          icon: AlertTriangle,
          badge: conflicts.length > 0 ? conflicts.length : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-pb shadow-lg"
    >
      <div className="grid grid-cols-5 h-14 items-center">
        {tabs.map((tab) => {
          const isActive = screen === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-teal-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-teal-600 rounded-full" />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More / Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center h-full min-h-[48px] py-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label="Open full mobile navigation menu"
        >
          <Menu className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
