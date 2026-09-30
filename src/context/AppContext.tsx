import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  DocumentRecord,
  TimelineEvent,
  Conflict,
  Gap,
  OpenLoop,
  PatientConsistencyIssue,
  AnalysisResult,
  ReviewState,
  HandoffSummary,
} from '../types';
import {
  DEMO_DOCUMENTS,
  DEMO_EVENTS,
  DEMO_PATIENT,
  PRECOMPUTED_HANDOFF_SUMMARY,
} from '../lib/demoData';
import { runFullAnalysis, buildDeterministicHandoffSummary } from '../lib/analysis';

export type ScreenType =
  | 'landing'
  | 'upload'
  | 'processing'
  | 'timeline'
  | 'meds_labs'
  | 'conflicts'
  | 'coverage'
  | 'records'
  | 'handoff'
  | 'ask';

interface AppContextType {
  screen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  patientInfo: { name: string; ageOrDob: string; id: string };

  // Data
  documents: DocumentRecord[];
  events: TimelineEvent[];
  conflicts: Conflict[];
  gaps: Gap[];
  openLoops: OpenLoop[];
  patientIssues: PatientConsistencyIssue[];
  stats: AnalysisResult['stats'];

  // Gaps
  gapThreshold: number;
  setGapThreshold: (days: number) => void;

  // Selected for Drawers / Modals
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  sourceViewerState: { docId: string; highlightText?: string | null; page?: number | null } | null;
  setSourceViewerState: (state: { docId: string; highlightText?: string | null; page?: number | null } | null) => void;
  isCautiousModalOpen: boolean;
  setIsCautiousModalOpen: (open: boolean) => void;

  // Dismissible Notices
  isSafetyNoticeDismissed: boolean;
  dismissSafetyNotice: () => void;
  isPatientWarningDismissed: boolean;
  dismissPatientWarning: () => void;

  // Filters for Timeline
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  providerFilter: string;
  setProviderFilter: (prov: string) => void;
  filterConflictsOnly: boolean;
  setFilterConflictsOnly: (val: boolean) => void;
  filterLowConfidence: boolean;
  setFilterLowConfidence: (val: boolean) => void;
  filterUnreviewedOnly: boolean;
  setFilterUnreviewedOnly: (val: boolean) => void;

  // Actions
  loadDemoData: () => void;
  runDemoProcessing: () => void;
  switchToDocumentMode: () => void;
  setReviewStatus: (eventId: string, state: ReviewState, note?: string) => void;
  resolveConflictStatus: (conflictId: string, reviewed: boolean) => void;
  startLiveProcessing: (files: File[]) => void;
  handoffSummary: HandoffSummary;
  refreshHandoffSummary: () => Promise<void>;
  isGeneratingHandoff: boolean;
  liveAiAvailable: boolean;

  // Mobile Menu Drawer
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Processing State & Error Handling
  processingStage: number;
  processingStageName: string;
  processedDocsCount: number;
  totalDocsToProcess: number;
  processingError: string | null;
  clearProcessingError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<ScreenType>('landing');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Separate states for Demo vs Real Document Mode to guarantee NO LEAKAGE
  const [demoDocs] = useState<DocumentRecord[]>(DEMO_DOCUMENTS);
  const [demoEvents, setDemoEvents] = useState<TimelineEvent[]>(DEMO_EVENTS);
  const [demoPatient] = useState(DEMO_PATIENT);

  const [liveDocs, setLiveDocs] = useState<DocumentRecord[]>([]);
  const [liveEvents, setLiveEvents] = useState<TimelineEvent[]>([]);
  const [livePatient, setLivePatient] = useState<{ name: string; ageOrDob: string; id: string }>({
    name: 'Patient Record',
    ageOrDob: 'From uploaded PDF',
    id: 'LIVE-DOC',
  });

  const [gapThreshold, setGapThreshold] = useState<number>(45);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sourceViewerState, setSourceViewerState] = useState<{
    docId: string;
    highlightText?: string | null;
    page?: number | null;
  } | null>(null);
  const [isCautiousModalOpen, setIsCautiousModalOpen] = useState<boolean>(false);

  const [isSafetyNoticeDismissed, setIsSafetyNoticeDismissed] = useState<boolean>(false);
  const [isPatientWarningDismissed, setIsPatientWarningDismissed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [filterConflictsOnly, setFilterConflictsOnly] = useState<boolean>(false);
  const [filterLowConfidence, setFilterLowConfidence] = useState<boolean>(false);
  const [filterUnreviewedOnly, setFilterUnreviewedOnly] = useState<boolean>(false);

  // Processing state
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [processingStageName, setProcessingStageName] = useState<string>('');
  const [processedDocsCount, setProcessedDocsCount] = useState<number>(0);
  const [totalDocsToProcess, setTotalDocsToProcess] = useState<number>(1);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Handoff Summary
  const [handoffSummary, setHandoffSummary] = useState<HandoffSummary>(PRECOMPUTED_HANDOFF_SUMMARY);
  const [isGeneratingHandoff, setIsGeneratingHandoff] = useState<boolean>(false);
  const [liveAiAvailable, setLiveAiAvailable] = useState<boolean>(false);

  // Health check on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setLiveAiAvailable(Boolean(data?.liveAiAvailable));
      })
      .catch(() => {
        setLiveAiAvailable(false);
      });
  }, []);

  // Determine current active docs, events, and patient based on isDemoMode
  const activeDocs = isDemoMode ? demoDocs : liveDocs;
  const activeEvents = isDemoMode ? demoEvents : liveEvents;
  const patientInfo = isDemoMode ? demoPatient : livePatient;

  // Run full analysis whenever active events, docs or gapThreshold change
  const analysis: AnalysisResult = useMemo(() => {
    return runFullAnalysis(activeEvents, activeDocs, gapThreshold);
  }, [activeEvents, activeDocs, gapThreshold]);

  const loadDemoData = () => {
    setIsDemoMode(true);
    setProcessingError(null);
    setHandoffSummary(PRECOMPUTED_HANDOFF_SUMMARY);
    setScreen('timeline');
  };

  const runDemoProcessing = () => {
    setIsDemoMode(true);
    setProcessingError(null);
    setScreen('processing');
    setTotalDocsToProcess(10);
    setProcessedDocsCount(0);
    setProcessingStage(1);
    setProcessingStageName('Reading documents');

    const stages = [
      { step: 1, name: 'Reading documents', docs: 3 },
      { step: 2, name: 'Extracting events', docs: 6 },
      { step: 3, name: 'Normalizing dates', docs: 8 },
      { step: 4, name: 'Linking evidence', docs: 10 },
      { step: 5, name: 'Checking consistency & conflicts', docs: 10 },
      { step: 6, name: 'Building timeline', docs: 10 },
    ];

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < stages.length) {
        setProcessingStage(stages[current].step);
        setProcessingStageName(stages[current].name);
        setProcessedDocsCount(stages[current].docs);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setHandoffSummary(PRECOMPUTED_HANDOFF_SUMMARY);
          setScreen('timeline');
        }, 500);
      }
    }, 600);
  };

  const switchToDocumentMode = () => {
    setIsDemoMode(false);
    setProcessingError(null);
    if (liveEvents.length > 0) {
      setScreen('timeline');
    } else {
      setScreen('upload');
    }
  };

  const setReviewStatus = (eventId: string, state: ReviewState, note?: string) => {
    if (isDemoMode) {
      setDemoEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, review: { state, note: note ?? e.review.note } } : e))
      );
    } else {
      setLiveEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, review: { state, note: note ?? e.review.note } } : e))
      );
    }
  };

  const resolveConflictStatus = (_conflictId: string, _reviewed: boolean) => {
    // In-memory conflict status toggle
  };

  const refreshHandoffSummary = async () => {
    setIsGeneratingHandoff(true);
    try {
      if (liveAiAvailable && analysis.events.length > 0) {
        const response = await fetch('/api/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: analysis.events,
            conflicts: analysis.conflicts,
            gaps: analysis.gaps,
            openLoops: analysis.openLoops,
          }),
        });
        const resData = await response.json();
        if (resData.success && resData.data) {
          setHandoffSummary(resData.data);
          setIsGeneratingHandoff(false);
          return;
        }
      }
    } catch {
      // Fall back to deterministic
    }
    const deterministic = buildDeterministicHandoffSummary(
      analysis.events,
      analysis.conflicts,
      analysis.gaps,
      analysis.openLoops,
      analysis.documents
    );
    setHandoffSummary(deterministic);
    setIsGeneratingHandoff(false);
  };

  const startLiveProcessing = async (files: File[]) => {
    // Set to document mode and clear any previous live state
    setIsDemoMode(false);
    setProcessingError(null);
    setLiveDocs([]);
    setLiveEvents([]);
    setSelectedEventId(null);
    setSourceViewerState(null);

    setScreen('processing');
    setTotalDocsToProcess(files.length);
    setProcessedDocsCount(0);
    setProcessingStage(1);
    setProcessingStageName(`Reading ${files.length} document file${files.length > 1 ? 's' : ''}...`);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));

      setProcessingStage(2);
      setProcessingStageName('Sending actual PDF document bytes to Gemini 3.8 Flash...');

      const response = await fetch('/api/analyze-records', {
        method: 'POST',
        body: formData,
      });

      setProcessingStage(3);
      setProcessingStageName('Extracting clinical events, dates, medications & tests with Gemini...');

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Server returned an error during analysis.');
      }

      setProcessingStage(4);
      setProcessingStageName('Linking verbatim evidence quotes & page numbers...');
      setProcessedDocsCount(files.length);

      const uploadedDocs: DocumentRecord[] = resData.documents || [];
      const extractedEvents: TimelineEvent[] = resData.events || [];

      if (extractedEvents.length === 0) {
        throw new Error(
          'No medical events could be extracted from this document. Please verify the document contains clinical notes, prescriptions, or lab reports.'
        );
      }

      setProcessingStage(5);
      setProcessingStageName('Checking consistency, calculating gaps & potential conflicts...');

      setLiveDocs(uploadedDocs);
      setLiveEvents(extractedEvents);

      // Determine patient info from extracted document metadata (NEVER use demo patient)
      const detectedDocWithPatient = uploadedDocs.find(
        (d) => d.patientName && d.patientName.trim().length > 0
      );
      if (detectedDocWithPatient && detectedDocWithPatient.patientName) {
        setLivePatient({
          name: detectedDocWithPatient.patientName,
          ageOrDob: detectedDocWithPatient.patientAgeOrDob || 'Not specified in record',
          id: 'DOC-MODE',
        });
      } else {
        const primaryFileName = files[0].name.replace(/\.[^/.]+$/, '');
        setLivePatient({
          name: primaryFileName,
          ageOrDob: 'Patient in uploaded document',
          id: 'DOC-MODE',
        });
      }

      // Generate handoff summary specifically for these newly extracted events
      const newAnalysis = runFullAnalysis(extractedEvents, uploadedDocs, gapThreshold);
      const newHandoff = buildDeterministicHandoffSummary(
        newAnalysis.events,
        newAnalysis.conflicts,
        newAnalysis.gaps,
        newAnalysis.openLoops,
        newAnalysis.documents
      );
      setHandoffSummary(newHandoff);

      setProcessingStage(6);
      setProcessingStageName('Timeline ready');

      setTimeout(() => {
        setScreen('timeline');
      }, 500);
    } catch (err: any) {
      console.error('[Client] Document analysis error:', err);
      setProcessingError(err.message || 'Document analysis failed. Please try again.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        isDemoMode,
        setIsDemoMode,
        patientInfo,
        documents: analysis.documents,
        events: analysis.events,
        conflicts: analysis.conflicts,
        gaps: analysis.gaps,
        openLoops: analysis.openLoops,
        patientIssues: analysis.patientIssues,
        stats: analysis.stats,
        gapThreshold,
        setGapThreshold,
        selectedEventId,
        setSelectedEventId,
        sourceViewerState,
        setSourceViewerState,
        isCautiousModalOpen,
        setIsCautiousModalOpen,
        isSafetyNoticeDismissed,
        dismissSafetyNotice: () => setIsSafetyNoticeDismissed(true),
        isPatientWarningDismissed,
        dismissPatientWarning: () => setIsPatientWarningDismissed(true),
        searchTerm,
        setSearchTerm,
        categoryFilter,
        setCategoryFilter,
        providerFilter,
        setProviderFilter,
        filterConflictsOnly,
        setFilterConflictsOnly,
        filterLowConfidence,
        setFilterLowConfidence,
        filterUnreviewedOnly,
        setFilterUnreviewedOnly,
        loadDemoData,
        runDemoProcessing,
        switchToDocumentMode,
        setReviewStatus,
        resolveConflictStatus,
        startLiveProcessing,
        handoffSummary,
        refreshHandoffSummary,
        isGeneratingHandoff,
        liveAiAvailable,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        processingStage,
        processingStageName,
        processedDocsCount,
        totalDocsToProcess,
        processingError,
        clearProcessingError: () => setProcessingError(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
