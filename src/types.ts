export type DocumentType =
  | 'consultation_note'
  | 'discharge_summary'
  | 'prescription'
  | 'lab_report'
  | 'diagnostic_report'
  | 'imaging_report'
  | 'follow_up_note'
  | 'referral'
  | 'other';

export type ExtractionStatus = 'pending' | 'processing' | 'done' | 'partial' | 'failed';

export interface DocumentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  documentType: DocumentType;
  documentDate: string | null;
  documentDateBasis: 'explicit' | 'unknown';
  patientName: string | null;
  patientAgeOrDob: string | null;
  provider: string | null;
  facility: string | null;
  pageCount: number | null;
  extractionStatus: ExtractionStatus;
  errorMessage?: string;
  eventCount: number;
  rawText?: string;
  fileUrl?: string; // base64 or blob URL if uploaded
}

export type EventType =
  | 'visit'
  | 'test'
  | 'diagnosis'
  | 'medication'
  | 'treatment'
  | 'follow_up'
  | 'other';

export type DatePrecision = 'day' | 'month' | 'year' | 'unknown';
export type DateBasis = 'explicit' | 'relative_to_document_date' | 'document_date' | 'unknown';
export type EvidenceBasis = 'explicit' | 'inferred' | 'uncertain';
export type DiagnosisCertainty = 'confirmed' | 'suspected' | 'history' | 'unspecified';
export type TestStatus = 'ordered' | 'resulted';
export type MedicationStatus =
  | 'started'
  | 'continued'
  | 'changed'
  | 'stopped'
  | 'listed'
  | 'unspecified';
export type ReviewState = 'unreviewed' | 'confirmed' | 'flagged';

export interface DiagnosisItem {
  text: string;
  certainty: DiagnosisCertainty;
}

export interface TestItem {
  name: string;
  normalizedName: string;
  status: TestStatus;
  resultValue: string | null;
  unit: string | null;
  referenceRange: string | null;
  reportFlag: string | null; // e.g. "HIGH", "NORMAL", "LOW"
  resultText: string | null;
}

export interface MedicationItem {
  name: string;
  normalizedName: string;
  dose: string | null;
  frequency: string | null;
  route: string | null;
  duration: string | null;
  status: MedicationStatus;
  statusNote: string | null;
}

export interface FollowUpItem {
  plannedInterval: string | null;
  plannedDate: string | null;
  purpose: string | null;
}

export interface RelatedEventRef {
  id: string;
  relation: 'ordered_at' | 'result_of' | 'prescribed_at' | 'follow_up_of' | 'same_event';
}

export interface CorroborationItem {
  sourceDocumentId: string;
  sourceDocument: string;
  sourcePage: number | null;
  evidenceText: string | null;
}

export interface EventReview {
  state: ReviewState;
  note?: string;
}

export interface TimelineEvent {
  id: string;
  date: string | null; // ISO YYYY-MM-DD or YYYY-MM or YYYY or null
  datePrecision: DatePrecision;
  dateBasis: DateBasis;
  eventType: EventType;
  title: string;
  provider: string | null;
  facility: string | null;
  symptoms: string[];
  diagnoses: DiagnosisItem[];
  tests: TestItem[];
  medications: MedicationItem[];
  treatments: string[];
  followUp: FollowUpItem | null;
  notes: string | null;
  sourceDocumentId: string;
  sourceDocument: string;
  sourcePage: number | null;
  evidenceText: string | null; // verbatim quote
  confidence: number; // 0..1
  confidenceReason: string;
  evidenceBasis: EvidenceBasis;
  relatedEventIds: RelatedEventRef[];
  corroboratedBy: CorroborationItem[];
  review: EventReview;
}

export type ConflictPriority = 'High' | 'Medium' | 'Low';
export type ConflictType =
  | 'medication_dose'
  | 'medication_status'
  | 'test_result'
  | 'date_discrepancy'
  | 'diagnosis_inconsistency';

export interface ConflictSide {
  label: string; // "Record A" | "Record B"
  documentId: string;
  documentName: string;
  date: string | null;
  valueText: string;
  evidenceText: string;
  eventId: string;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  reviewPriority: ConflictPriority;
  title: string;
  description: string;
  sides: ConflictSide[];
  status: 'open' | 'reviewed';
}

export interface Gap {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  previousEventId: string;
  nextEventId: string;
}

export interface OpenLoop {
  id: string;
  planText: string;
  sourceEventId: string;
  sourceDocument: string;
  sourceDate: string;
  expectedWindowStart: string;
  expectedWindowEnd: string;
  status: 'matched' | 'unmatched' | 'beyond_span';
  matchedEventId?: string;
  nearestLaterEventId?: string;
  explanation?: string;
}

export interface HandoffBullet {
  text: string;
  sourceEventIds: string[];
}

export interface HandoffSection {
  heading: string;
  bullets: HandoffBullet[];
}

export interface HandoffSummary {
  generatedAt: string;
  sections: HandoffSection[];
  disclaimer: string;
}

export interface PatientConsistencyIssue {
  field: string;
  values: Array<{ documentName: string; value: string }>;
}

export interface AnalysisResult {
  documents: DocumentRecord[];
  events: TimelineEvent[];
  conflicts: Conflict[];
  gaps: Gap[];
  openLoops: OpenLoop[];
  patientIssues: PatientConsistencyIssue[];
  stats: {
    totalDocuments: number;
    totalEvents: number;
    totalDiagnoses: number;
    totalMedications: number;
    totalConflicts: number;
    totalGaps: number;
    spanDays: number;
    firstDate: string | null;
    lastDate: string | null;
  };
}

export type UserRole = 'patient' | 'doctor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isDemoUser: boolean;
  role: UserRole;
  roleTitle?: string;
  avatarInitials?: string;
  createdAt: string;
}

export interface DoctorPatientSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  documentsCount: number;
  eventsCount: number;
  createdAt?: string;
}

export interface DatabaseStatus {
  connected: boolean;
  error: string | null;
  database: string;
  counts?: {
    users: number;
    documents: number;
    events: number;
  };
}

