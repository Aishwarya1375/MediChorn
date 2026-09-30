import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { SourceViewerModal } from './components/SourceViewerModal';
import { CautiousModal } from './components/CautiousModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';

// Screens
import { LandingScreen } from './screens/LandingScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { TimelineDashboard } from './screens/TimelineDashboard';
import { ConflictsScreen } from './screens/ConflictsScreen';
import { CoverageScreen } from './screens/CoverageScreen';
import { MedsLabsScreen } from './screens/MedsLabsScreen';
import { HandoffScreen } from './screens/HandoffScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { AskRecordsScreen } from './screens/AskRecordsScreen';

// Error Boundary for UI reliability
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-600 mb-6">
              An unexpected display issue occurred. You can reset to the fictional demo dataset.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { screen } = useApp();

  const renderScreen = () => {
    switch (screen) {
      case 'landing':
        return <LandingScreen />;
      case 'upload':
        return <UploadScreen />;
      case 'processing':
        return <ProcessingScreen />;
      case 'timeline':
        return <TimelineDashboard />;
      case 'conflicts':
        return <ConflictsScreen />;
      case 'coverage':
        return <CoverageScreen />;
      case 'meds_labs':
        return <MedsLabsScreen />;
      case 'handoff':
        return <HandoffScreen />;
      case 'records':
        return <RecordsScreen />;
      case 'ask':
        return <AskRecordsScreen />;
      default:
        return <TimelineDashboard />;
    }
  };

  const showSidebar = screen !== 'landing' && screen !== 'processing';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && <Sidebar />}

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 overflow-x-hidden">
          {renderScreen()}
        </main>
      </div>

      <Footer />

      {/* Mobile Navigation */}
      <MobileBottomNav />
      <MobileMenuDrawer />

      {/* Global Slide-in Drawer & Modals */}
      <EvidenceDrawer />
      <SourceViewerModal />
      <CautiousModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
