import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'doctor' | 'patient';
  phone?: string;
  createdAt: string;
  isActive: boolean;
}

export interface MedicalDocumentRecord {
  id: string;
  patientId: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  uploadedAt: string;
  analysisStatus: 'completed' | 'processing' | 'failed';
  documentDate?: string | null;
  documentType?: string;
  patientName?: string | null;
  patientAgeOrDob?: string | null;
  provider?: string | null;
  facility?: string | null;
  pageCount?: number;
  eventsCount?: number;
}

export interface TimelineEventRecord {
  id: string;
  patientId: string;
  documentId?: string;
  date: string | null;
  datePrecision?: string;
  eventType: string;
  title: string;
  symptoms: string[];
  diagnoses: Array<{ text: string; certainty: string }>;
  tests: Array<{ name: string; resultValue?: string; resultText?: string; unit?: string; status?: string }>;
  medications: Array<{ name: string; dose?: string; frequency?: string; status?: string }>;
  treatments: string[];
  sourceDocument: string;
  sourcePage?: number | null;
  evidenceText: string | null;
  confidence: number;
  createdAt: string;
}

export interface DoctorAccessRecord {
  id: string;
  doctorId: string;
  patientId: string;
  createdAt: string;
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const EVENTS_FILE = path.join(DATA_DIR, 'timeline-events.json');
const ACCESS_FILE = path.join(DATA_DIR, 'doctor-access.json');

// Ensure data directory and empty JSON files exist automatically
export function initStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const files = [USERS_FILE, RECORDS_FILE, EVENTS_FILE, ACCESS_FILE];
  for (const file of files) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
    }
  }
}

// Low-level atomic read/write helpers
function readJsonFile<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) return [];
    return JSON.parse(content) as T[];
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeJsonFile<T>(filePath: string, data: T[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// User storage methods
export function getAllUsers(): UserRecord[] {
  return readJsonFile<UserRecord>(USERS_FILE);
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const users = getAllUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

export function createUser(user: UserRecord): UserRecord {
  const users = getAllUsers();
  users.push(user);
  writeJsonFile(USERS_FILE, users);
  return user;
}

export function countUsers(filter?: Partial<UserRecord>): number {
  const users = getAllUsers();
  if (!filter) return users.length;
  return users.filter((u) => {
    for (const [key, val] of Object.entries(filter)) {
      if ((u as any)[key] !== val) return false;
    }
    return true;
  }).length;
}

// Medical documents storage methods
export function getAllDocuments(): MedicalDocumentRecord[] {
  return readJsonFile<MedicalDocumentRecord>(RECORDS_FILE);
}

export function getDocumentsByPatient(patientId: string): MedicalDocumentRecord[] {
  return getAllDocuments().filter((d) => d.patientId === patientId);
}

export function createDocument(doc: MedicalDocumentRecord): MedicalDocumentRecord {
  const docs = getAllDocuments();
  docs.push(doc);
  writeJsonFile(RECORDS_FILE, docs);
  return doc;
}

export function countDocuments(filter?: Partial<MedicalDocumentRecord>): number {
  const docs = getAllDocuments();
  if (!filter) return docs.length;
  return docs.filter((d) => {
    for (const [key, val] of Object.entries(filter)) {
      if ((d as any)[key] !== val) return false;
    }
    return true;
  }).length;
}

// Timeline events storage methods
export function getAllTimelineEvents(): TimelineEventRecord[] {
  return readJsonFile<TimelineEventRecord>(EVENTS_FILE);
}

export function getTimelineEventsByPatient(patientId: string): TimelineEventRecord[] {
  return getAllTimelineEvents().filter((e) => e.patientId === patientId);
}

export function createTimelineEvent(ev: TimelineEventRecord): TimelineEventRecord {
  const events = getAllTimelineEvents();
  events.push(ev);
  writeJsonFile(EVENTS_FILE, events);
  return ev;
}

export function countTimelineEvents(filter?: Partial<TimelineEventRecord>): number {
  const events = getAllTimelineEvents();
  if (!filter) return events.length;
  return events.filter((e) => {
    for (const [key, val] of Object.entries(filter)) {
      if ((e as any)[key] !== val) return false;
    }
    return true;
  }).length;
}

// Doctor-patient access relationships
export function getAllAccessLinks(): DoctorAccessRecord[] {
  return readJsonFile<DoctorAccessRecord>(ACCESS_FILE);
}

export function grantDoctorAccess(doctorId: string, patientId: string): DoctorAccessRecord {
  const links = getAllAccessLinks();
  const existing = links.find((l) => l.doctorId === doctorId && l.patientId === patientId);
  if (existing) return existing;
  const newLink: DoctorAccessRecord = {
    id: `access-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    doctorId,
    patientId,
    createdAt: new Date().toISOString(),
  };
  links.push(newLink);
  writeJsonFile(ACCESS_FILE, links);
  return newLink;
}

export function getAuthorizedPatientIds(doctorId: string): string[] {
  const links = getAllAccessLinks().filter((l) => l.doctorId === doctorId);
  return links.map((l) => l.patientId);
}
