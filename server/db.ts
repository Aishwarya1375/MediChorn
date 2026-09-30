import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'doctor' | 'patient';
  phone?: string;
  createdAt: string;
  isActive: boolean;
}

export interface DoctorPatientAccessDoc {
  _id: string;
  doctorId: string;
  patientId: string;
  accessType: string;
  createdAt: string;
}

export interface MedicalDocumentDoc {
  _id: string;
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

export interface TimelineEventDoc {
  _id: string;
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

const DB_NAME = 'medichron';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;
let connectionError: string | null = null;

// In-memory fallback repository when MongoDB is temporarily unreachable or MONGODB_URI is not set,
// ensuring the application never crashes while clearly distinguishing connection state.
class MemoryCollection<T extends { _id: string }> {
  private items: Map<string, T> = new Map();

  async find(query: Partial<T> = {}): Promise<{ toArray: () => Promise<T[]> }> {
    const list = Array.from(this.items.values()).filter((item) => {
      for (const [key, val] of Object.entries(query)) {
        if ((item as any)[key] !== val) return false;
      }
      return true;
    });
    return {
      toArray: async () => list,
    };
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    for (const item of this.items.values()) {
      let matches = true;
      for (const [key, val] of Object.entries(query)) {
        if ((item as any)[key] !== val) {
          matches = false;
          break;
        }
      }
      if (matches) return item;
    }
    return null;
  }

  async insertOne(doc: T): Promise<{ insertedId: string }> {
    this.items.set(doc._id, { ...doc });
    return { insertedId: doc._id };
  }

  async insertMany(docs: T[]): Promise<{ insertedCount: number }> {
    for (const d of docs) {
      this.items.set(d._id, { ...d });
    }
    return { insertedCount: docs.length };
  }

  async countDocuments(query: Partial<T> = {}): Promise<number> {
    const results = await this.find(query);
    return (await results.toArray()).length;
  }

  async deleteMany(query: Partial<T> = {}): Promise<{ deletedCount: number }> {
    let count = 0;
    for (const [id, item] of this.items.entries()) {
      let matches = true;
      for (const [key, val] of Object.entries(query)) {
        if ((item as any)[key] !== val) {
          matches = false;
          break;
        }
      }
      if (matches) {
        this.items.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  }
}

const memoryUsers = new MemoryCollection<UserDoc>();
const memoryAccess = new MemoryCollection<DoctorPatientAccessDoc>();
const memoryDocs = new MemoryCollection<MedicalDocumentDoc>();
const memoryEvents = new MemoryCollection<TimelineEventDoc>();

export async function connectToDatabase(): Promise<{ isConnected: boolean; error: string | null; mode: 'atlas' | 'fallback' }> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    connectionError = 'MONGODB_URI environment variable is not defined.';
    console.warn('⚠️ MONGODB_URI not provided. Running with in-memory database fallback.');
    return { isConnected: false, error: connectionError, mode: 'fallback' };
  }

  try {
    // Sanitize connection options
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    connectionError = null;
    console.log(`✅ Connected successfully to MongoDB Atlas database: "${DB_NAME}"`);

    // Create indexes safely
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('doctor_patient_access').createIndex({ doctorId: 1, patientId: 1 });
      await db.collection('medical_documents').createIndex({ patientId: 1 });
      await db.collection('timeline_events').createIndex({ patientId: 1 });
    } catch {
      // index already exists or background creation
    }

    return { isConnected: true, error: null, mode: 'atlas' };
  } catch (err: any) {
    isConnected = false;
    connectionError = err?.message || 'Database connection unavailable.';
    console.error('❌ MongoDB Atlas connection error (graceful fallback active):', connectionError);
    return { isConnected: false, error: connectionError, mode: 'fallback' };
  }
}

export function getDatabase(): Db | null {
  return db;
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}

export function getConnectionStatus(): { connected: boolean; error: string | null; database: string } {
  return {
    connected: isConnected,
    error: connectionError,
    database: DB_NAME,
  };
}

export function getCollections() {
  if (isConnected && db) {
    return {
      users: db.collection<UserDoc>('users'),
      access: db.collection<DoctorPatientAccessDoc>('doctor_patient_access'),
      documents: db.collection<MedicalDocumentDoc>('medical_documents'),
      events: db.collection<TimelineEventDoc>('timeline_events'),
      isAtlas: true,
    };
  }

  // Graceful fallback collection references
  return {
    users: memoryUsers as any as Collection<UserDoc>,
    access: memoryAccess as any as Collection<DoctorPatientAccessDoc>,
    documents: memoryDocs as any as Collection<MedicalDocumentDoc>,
    events: memoryEvents as any as Collection<TimelineEventDoc>,
    isAtlas: false,
  };
}
