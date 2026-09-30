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
  UserProfile,
  UserRole,
  DatabaseStatus,
  DoctorPatientSummary,
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
  | 'login'
  | 'signup'
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
  patientInfo: { name: string; ageOrDob: string; id: string; email?: string };
  patientEmail: string;
  setPatientEmail: (email: string) => void;

  // Email Delivery Integration
  sendSummaryEmail: (options: {
    patientEmail: string;
    pdfData: string;
    fileName?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string; unconfigured?: boolean }>;
  emailConfig: { configured: boolean; provider: string | null; fromEmail?: string } | null;

  // Role & Authentication
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  currentUser: UserProfile | null;
  authToken: string | null;
  dbStatus: DatabaseStatus | null;
  doctorPatients: DoctorPatientSummary[];
  activePatientId: string | null;
  selectDoctorPatient: (patientId: string) => Promise<void>;
  refreshDoctorPatients: () => Promise<void>;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoPatient: () => void;
  loginAsDemoDoctor: () => void;
  loginAsDemoUser: (preferredRole?: UserRole) => void;
  logout: () => void;

  // Actions
  loadSampleHypertensionPdf: () => Promise<void>;

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
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('medichron_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored user', e);
    }
    return null;
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (currentUser?.role) return currentUser.role;
    try {
      const storedRole = localStorage.getItem('medichron_role');
      if (storedRole === 'patient' || storedRole === 'doctor') return storedRole;
    } catch {
      // ignore
    }
    return 'doctor';
  });

  const [screen, setScreenState] = useState<ScreenType>(() => {
    // If user has a valid active session, land directly on timeline
    try {
      const stored = localStorage.getItem('medichron_user');
      if (stored) return 'timeline';
    } catch {
      // ignore
    }
    return 'landing';
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('medichron_token');
    } catch {
      return null;
    }
  });

  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [doctorPatients, setDoctorPatients] = useState<DoctorPatientSummary[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  // Protected route transition wrapper
  const setScreen = (nextScreen: ScreenType) => {
    const isPublic = nextScreen === 'landing' || nextScreen === 'login' || nextScreen === 'signup';
    if (!isPublic && !currentUser) {
      setScreenState('login');
      return;
    }
    setScreenState(nextScreen);
  };

  // Check database status and verify active token session on startup
  useEffect(() => {
    // 1. Fetch real MongoDB Atlas connection status
    fetch('/api/db-status')
      .then((res) => res.json())
      .then((data: DatabaseStatus) => {
        setDbStatus(data);
      })
      .catch((err) => {
        console.warn('Could not fetch MongoDB status:', err);
        setDbStatus({
          connected: false,
          error: 'Backend database service unreachable',
          database: 'medichron',
        });
      });

    // 2. Validate stored JWT token with /api/auth/me
    const storedToken = localStorage.getItem('medichron_token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            const profile: UserProfile = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              isDemoUser: false,
              role: data.user.role,
              roleTitle: data.user.role === 'patient' ? 'Patient' : 'Attending Physician',
              avatarInitials: data.user.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
              createdAt: data.user.createdAt,
            };
            setCurrentUser(profile);
            setSelectedRole(data.user.role);

            if (data.user.role === 'doctor') {
              loadDoctorPatients(storedToken);
            } else if (data.user.role === 'patient') {
              loadPatientRecords(data.user.id, storedToken);
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('medichron_token');
            setAuthToken(null);
          }
        })
        .catch(() => {
          // Keep offline session if present
        });
    }
  }, []);

  // Fetch authorized patients list for doctor role from MongoDB
  const loadDoctorPatients = async (tokenOverride?: string) => {
    const t = tokenOverride || authToken || localStorage.getItem('medichron_token');
    if (!t) return;
    try {
      const res = await fetch('/api/doctor/patients', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.patients)) {
        setDoctorPatients(data.patients);
        // Default to first patient with documents or first available
        if (data.patients.length > 0 && !activePatientId) {
          const defaultPat = data.patients.find((p: DoctorPatientSummary) => p.documentsCount > 0) || data.patients[0];
          setActivePatientId(defaultPat.id);
          await loadPatientRecords(defaultPat.id, t);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor patients:', err);
    }
  };

  // Fetch records and timeline events for a given patient from MongoDB
  const loadPatientRecords = async (patientId: string, tokenOverride?: string) => {
    const t = tokenOverride || authToken || localStorage.getItem('medichron_token');
    if (!t) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/records`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        if (data.documents && data.documents.length > 0) {
          const mappedDocs: DocumentRecord[] = data.documents.map((d: any) => ({
            id: d._id || d.id,
            fileName: d.fileName,
            sizeBytes: d.fileSize || 1024,
            mimeType: d.mimeType || 'application/pdf',
            extractionStatus: d.analysisStatus === 'completed' ? 'done' : d.analysisStatus || 'done',
            pageCount: d.pageCount || 1,
            eventCount: d.eventsCount || 0,
            documentDate: d.documentDate || null,
            documentType: d.documentType || 'follow_up_note',
            patientName: d.patientName || data.patient?.name || null,
            patientAgeOrDob: d.patientAgeOrDob || null,
            provider: d.provider || null,
            facility: d.facility || null,
          }));
          setLiveDocs(mappedDocs);
        } else {
          setLiveDocs([]);
        }

        if (data.events && data.events.length > 0) {
          const mappedEvents: TimelineEvent[] = data.events.map((e: any) => ({
            id: e._id || e.id,
            sourceDocumentId: e.documentId || 'doc-1',
            sourceDocument: e.sourceDocument || 'Document',
            sourcePage: e.sourcePage || 1,
            date: e.date || null,
            datePrecision: e.datePrecision || 'day',
            eventType: e.eventType || 'visit',
            title: e.title,
            evidenceText: e.evidenceText || null,
            confidence: e.confidence || 0.95,
            diagnoses: e.diagnoses || [],
            tests: e.tests || [],
            medications: e.medications || [],
            symptoms: e.symptoms || [],
            treatments: e.treatments || [],
          }));
          setLiveEvents(mappedEvents);
        } else {
          setLiveEvents([]);
        }

        if (data.patient) {
          setLivePatient({
            name: data.patient.name,
            ageOrDob: 'From MongoDB profile',
            id: data.patient.id,
            email: data.patient.email,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load patient records from MongoDB:', err);
    }
  };

  const selectDoctorPatient = async (patientId: string) => {
    setActivePatientId(patientId);
    setIsDemoMode(false);
    await loadPatientRecords(patientId);
  };

  // Real server-side login with password hash verification in MongoDB
  const login = async (
    email: string,
    password?: string,
    role?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // Fast-track Demo Accounts bypass
    if (trimmedEmail === 'demo@medichron.ai' || trimmedEmail === 'doctor.demo@medichron.ai') {
      loginAsDemoDoctor();
      return { success: true };
    }
    if (
      trimmedEmail === 'patient.demo@medichron.ai' ||
      trimmedEmail === 'demo.patient@medichron.test' ||
      trimmedEmail === 'demo.patient@medichron.ai'
    ) {
      loginAsDemoPatient();
      return { success: true };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid email or password.',
        };
      }

      const { token, user } = data;
      setAuthToken(token);
      localStorage.setItem('medichron_token', token);

      const profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        isDemoUser: false,
        role: user.role,
        roleTitle: user.role === 'patient' ? 'Patient' : 'Attending Physician',
        avatarInitials: user.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        createdAt: user.createdAt,
      };

      setCurrentUser(profile);
      setSelectedRole(user.role);
      setIsDemoMode(false);
      localStorage.setItem('medichron_user', JSON.stringify(profile));
      localStorage.setItem('medichron_role', user.role);

      // Load role-specific data from MongoDB
      if (user.role === 'patient') {
        await loadPatientRecords(user.id, token);
      } else if (user.role === 'doctor') {
        await loadDoctorPatients(token);
      }

      setScreenState('timeline');
      return { success: true };
    } catch (err: any) {
      console.error('Login network error:', err);
      return {
        success: false,
        error: 'Authentication server unavailable. Please try again.',
      };
    }
  };

  // Real server-side signup inserting into MongoDB
  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to create account.',
        };
      }

      const { token, user } = data;
      setAuthToken(token);
      localStorage.setItem('medichron_token', token);

      const profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        isDemoUser: false,
        role: user.role,
        roleTitle: user.role === 'patient' ? 'Patient' : 'Attending Physician',
        avatarInitials: user.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        createdAt: user.createdAt,
      };

      setCurrentUser(profile);
      setSelectedRole(user.role);
      setIsDemoMode(false);
      localStorage.setItem('medichron_user', JSON.stringify(profile));
      localStorage.setItem('medichron_role', user.role);

      setScreenState('timeline');
      return { success: true };
    } catch (err: any) {
      console.error('Signup error:', err);
      return {
        success: false,
        error: 'Backend server connection error. Please try again.',
      };
    }
  };

  const loginAsDemoPatient = () => {
    const demoPatientProfile: UserProfile = {
      id: 'demo-patient-synthetic',
      name: 'Ananya Rao',
      email: 'demo.patient@medichron.test',
      isDemoUser: true,
      role: 'patient',
      roleTitle: 'Patient (Personal View)',
      avatarInitials: 'AR',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(demoPatientProfile);
    setSelectedRole('patient');
    setIsDemoMode(true);
    localStorage.setItem('medichron_user', JSON.stringify(demoPatientProfile));
    localStorage.setItem('medichron_role', 'patient');
    setScreenState('timeline');
  };

  const loginAsDemoDoctor = () => {
    const demoDoctorProfile: UserProfile = {
      id: 'demo-doctor-synthetic',
      name: 'Dr. Sarah Mitchell, MD',
      email: 'doctor.demo@medichron.ai',
      isDemoUser: true,
      role: 'doctor',
      roleTitle: 'Attending Physician',
      avatarInitials: 'SM',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(demoDoctorProfile);
    setSelectedRole('doctor');
    setIsDemoMode(true);
    localStorage.setItem('medichron_user', JSON.stringify(demoDoctorProfile));
    localStorage.setItem('medichron_role', 'doctor');
    setScreenState('timeline');
  };

  const loginAsDemoUser = (preferredRole?: UserRole) => {
    const targetRole = preferredRole || selectedRole;
    if (targetRole === 'patient') {
      loginAsDemoPatient();
    } else {
      loginAsDemoDoctor();
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('medichron_token');
    localStorage.removeItem('medichron_user');
    setScreenState('login');
  };

  // Separate states for Demo vs Real Document Mode to guarantee NO LEAKAGE
  const [demoDocs] = useState<DocumentRecord[]>(DEMO_DOCUMENTS);
  const [demoEvents, setDemoEvents] = useState<TimelineEvent[]>(DEMO_EVENTS);
  const [demoPatient] = useState(DEMO_PATIENT);

  const [liveDocs, setLiveDocs] = useState<DocumentRecord[]>([]);
  const [liveEvents, setLiveEvents] = useState<TimelineEvent[]>([]);
  const [livePatient, setLivePatient] = useState<{ name: string; ageOrDob: string; id: string; email?: string }>({
    name: 'Patient Record',
    ageOrDob: 'From uploaded PDF',
    id: 'LIVE-DOC',
    email: '',
  });

  const [customPatientEmail, setCustomPatientEmail] = useState<string>('');

  const [emailConfig, setEmailConfig] = useState<{
    configured: boolean;
    provider: string | null;
    fromEmail?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/email-config')
      .then((res) => res.json())
      .then((data) => setEmailConfig(data))
      .catch(() => setEmailConfig({ configured: false, provider: null }));
  }, []);

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

  // Analysis result calculated strictly based on mode
  const currentDocs = isDemoMode ? demoDocs : liveDocs;
  const currentEvents = isDemoMode ? demoEvents : liveEvents;
  const patientInfo = isDemoMode ? demoPatient : livePatient;

  const patientEmail = useMemo(() => {
    if (customPatientEmail) return customPatientEmail;
    if (isDemoMode) {
      return 'demo.patient@medichron.test';
    }
    if (currentUser?.role === 'patient' && currentUser.email) {
      return currentUser.email;
    }
    return livePatient.email || '';
  }, [customPatientEmail, isDemoMode, currentUser, livePatient.email]);

  const sendSummaryEmail = async (options: {
    patientEmail: string;
    pdfData: string;
    fileName?: string;
  }): Promise<{ success: boolean; error?: string; message?: string; unconfigured?: boolean }> => {
    try {
      const res = await fetch('/api/send-summary-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      return data;
    } catch (err: unknown) {
      console.error('Error sending summary email:', err);
      return {
        success: false,
        error: 'Unable to send summary email',
      };
    }
  };

  const analysis = useMemo(() => {
    return runFullAnalysis(currentEvents, currentDocs, gapThreshold);
  }, [currentDocs, currentEvents, gapThreshold]);

  // Handoff Summary
  const [handoffSummary, setHandoffSummary] = useState<HandoffSummary>(PRECOMPUTED_HANDOFF_SUMMARY);
  const [isGeneratingHandoff, setIsGeneratingHandoff] = useState<boolean>(false);
  const [liveAiAvailable, setLiveAiAvailable] = useState<boolean>(false);

  // Processing state
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [processingStageName, setProcessingStageName] = useState<string>('');
  const [processedDocsCount, setProcessedDocsCount] = useState<number>(0);
  const [totalDocsToProcess, setTotalDocsToProcess] = useState<number>(0);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Check health of server & live Gemini API on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.liveAiAvailable) {
          setLiveAiAvailable(true);
        }
      })
      .catch(() => {
        setLiveAiAvailable(false);
      });
  }, []);

  // Update handoff summary dynamically when events change
  useEffect(() => {
    if (isDemoMode) {
      setHandoffSummary(PRECOMPUTED_HANDOFF_SUMMARY);
    } else if (liveEvents.length > 0) {
      const computed = buildDeterministicHandoffSummary(
        analysis.events,
        analysis.conflicts,
        analysis.gaps,
        analysis.openLoops,
        analysis.documents
      );
      setHandoffSummary(computed);
    }
  }, [isDemoMode, liveEvents, analysis]);

  const loadDemoData = () => {
    setIsDemoMode(true);
    setSelectedEventId(null);
    setSourceViewerState(null);
    setScreen('timeline');
  };

  const runDemoProcessing = () => {
    if (!currentUser) {
      loginAsDemoUser();
      return;
    }
    setIsDemoMode(true);
    setSelectedEventId(null);
    setSourceViewerState(null);
    setScreen('timeline');
  };

  const switchToDocumentMode = () => {
    setIsDemoMode(false);
    setSelectedEventId(null);
    setSourceViewerState(null);
    setScreen('upload');
  };

  const setReviewStatus = (eventId: string, state: ReviewState, note?: string) => {
    if (isDemoMode) {
      setDemoEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, review: { state, note } } : e))
      );
    } else {
      setLiveEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, review: { state, note } } : e))
      );
    }
  };

  const resolveConflictStatus = (conflictId: string, reviewed: boolean) => {
    const targetConflict = analysis.conflicts.find((c) => c.id === conflictId);
    if (targetConflict) {
      targetConflict.status = reviewed ? 'reviewed' : 'open';
    }
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

    setScreenState('processing');
    setTotalDocsToProcess(files.length);
    setProcessedDocsCount(0);
    setProcessingStage(1);
    setProcessingStageName(`Reading ${files.length} document file${files.length > 1 ? 's' : ''}...`);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));

      const targetPatientId =
        currentUser?.role === 'patient'
          ? currentUser.id
          : activePatientId || 'pat-aarav-rao';
      formData.append('patientId', targetPatientId);

      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      setProcessingStage(2);
      setProcessingStageName('Sending actual PDF document bytes to Gemini 3.8 Flash...');

      const response = await fetch('/api/analyze-records', {
        method: 'POST',
        headers,
        body: formData,
      });

      setProcessingStage(3);
      setProcessingStageName('Extracting clinical events, dates, medications & tests with Gemini...');

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Server returned an error during analysis.');
      }

      setProcessingStage(4);
      setProcessingStageName('Normalizing dates & linking verbatim document citations...');

      const extractedDocs: DocumentRecord[] = resData.documents || resData.data?.documents || [];
      const extractedEvents: TimelineEvent[] = resData.events || resData.data?.events || [];

      const firstDocWithPatient = extractedDocs.find((d) => d.patientName);
      const patient = resData.patient || resData.data?.patient || {
        name:
          firstDocWithPatient?.patientName ||
          (currentUser?.role === 'patient' ? currentUser.name : 'Patient Record'),
        ageOrDob: firstDocWithPatient?.patientAgeOrDob || 'From uploaded PDF',
        id: firstDocWithPatient?.id || 'LIVE-DOC-1',
      };

      setLiveDocs(extractedDocs);
      setLiveEvents(extractedEvents);
      setLivePatient(patient);
      setProcessedDocsCount(extractedDocs.length);

      // Also refresh doctor patient list count if clinician
      if (currentUser?.role === 'doctor') {
        loadDoctorPatients();
      }

      setProcessingStage(5);
      setProcessingStageName('Validating consistency & finalizing chronological care stream...');

      setTimeout(() => {
        setScreenState('timeline');
      }, 700);
    } catch (err: unknown) {
      console.error('Analysis failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze uploaded PDF with Gemini.';
      setProcessingError(message);
      setScreenState('processing');
    }
  };

  const loadSampleHypertensionPdf = async () => {
    try {
      setProcessingError(null);
      setIsDemoMode(false);
      setScreenState('processing');
      const res = await fetch('/api/sample-hypertension');
      if (!res.ok) throw new Error('Could not load sample_hypertension.pdf from server');
      const blob = await res.blob();
      const file = new File([blob], 'sample_hypertension.pdf', { type: 'application/pdf' });
      await startLiveProcessing([file]);
    } catch (err: unknown) {
      console.error('Failed to load sample_hypertension.pdf:', err);
      const message = err instanceof Error ? err.message : 'Failed to load test PDF';
      setProcessingError(message);
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
        patientEmail,
        setPatientEmail: setCustomPatientEmail,
        sendSummaryEmail,
        emailConfig,
        selectedRole,
        setSelectedRole,
        currentUser,
        authToken,
        dbStatus,
        doctorPatients,
        activePatientId,
        selectDoctorPatient,
        refreshDoctorPatients: () => loadDoctorPatients(),
        login,
        signup,
        loginAsDemoPatient,
        loginAsDemoDoctor,
        loginAsDemoUser,
        logout,
        loadSampleHypertensionPdf,
        documents: currentDocs,
        events: currentEvents,
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
