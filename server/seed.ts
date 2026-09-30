import dotenv from 'dotenv';
import { connectToDatabase, getCollections, UserDoc, DoctorPatientAccessDoc, MedicalDocumentDoc, TimelineEventDoc } from './db.js';
import { hashPassword } from './auth.js';

dotenv.config();

// Secure default seed password used for demo evaluation accounts
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || 'Medichron@2026';

export async function seedDatabase(): Promise<{
  doctorsCreated: number;
  patientsCreated: number;
  accessLinksCreated: number;
}> {
  const { users, access, documents, events } = getCollections();

  let doctorsCreated = 0;
  let patientsCreated = 0;
  let accessLinksCreated = 0;

  const defaultPasswordHash = await hashPassword(DEMO_PASSWORD);

  // Exactly TWO initial demo doctor accounts
  const demoDoctors: Array<Omit<UserDoc, 'createdAt'>> = [
    {
      _id: 'doc-dr-ananya-sharma',
      name: 'Dr. Ananya Sharma',
      email: 'dr.ananya@medichron.demo',
      passwordHash: defaultPasswordHash,
      role: 'doctor',
      phone: '+1 (555) 234-8901',
      isActive: true,
    },
    {
      _id: 'doc-dr-rahul-mehta',
      name: 'Dr. Rahul Mehta',
      email: 'dr.rahul@medichron.demo',
      passwordHash: defaultPasswordHash,
      role: 'doctor',
      phone: '+1 (555) 345-9012',
      isActive: true,
    },
  ];

  // Exactly FIVE initial demo patient accounts
  const demoPatients: Array<Omit<UserDoc, 'createdAt'>> = [
    {
      _id: 'pat-aarav-rao',
      name: 'Aarav Rao',
      email: 'aarav@medichron.demo',
      passwordHash: defaultPasswordHash,
      role: 'patient',
      phone: '+1 (555) 456-0123',
      isActive: true,
    },
    {
      _id: 'pat-ananya-iyer',
      name: 'Ananya Iyer',
      email: 'ananya@medichron.demo',
      passwordHash: defaultPasswordHash,
      role: 'patient',
      phone: '+1 (555) 567-1234',
      isActive: true,
    },
    {
      _id: 'pat-riya-sharma',
      name: 'Riya Sharma',
      email: 'riya@medichron.demo',
      passwordHash: defaultPasswordHash,
      role: 'patient',
      phone: '+1 (555) 678-2345',
      isActive: true,
    },
    {
      _id: 'pat-kabir-mehta',
      name: 'Kabir Mehta',
      email: 'kabir@medichron.demo',
      passwordHash: defaultPasswordHash,
      role: 'patient',
      phone: '+1 (555) 789-3456',
      isActive: true,
    },
    {
      _id: 'pat-sneha-patel',
      name: 'Sneha Patel',
      email: 'sneha@medichron.demo',
      passwordHash: defaultPasswordHash,
      role: 'patient',
      phone: '+1 (555) 890-4567',
      isActive: true,
    },
  ];

  // Insert doctors idempotently
  const doctorIds: string[] = [];
  for (const doc of demoDoctors) {
    const existing = await users.findOne({ email: doc.email.toLowerCase() });
    if (!existing) {
      const now = new Date().toISOString();
      await users.insertOne({
        ...doc,
        email: doc.email.toLowerCase(),
        createdAt: now,
      });
      doctorIds.push(doc._id);
      doctorsCreated++;
    } else {
      doctorIds.push(existing._id);
    }
  }

  // Insert patients idempotently
  const patientIds: string[] = [];
  for (const pat of demoPatients) {
    const existing = await users.findOne({ email: pat.email.toLowerCase() });
    if (!existing) {
      const now = new Date().toISOString();
      await users.insertOne({
        ...pat,
        email: pat.email.toLowerCase(),
        createdAt: now,
      });
      patientIds.push(pat._id);
      patientsCreated++;
    } else {
      patientIds.push(existing._id);
    }
  }

  // Seed doctor_patient_access so both doctors can access all demo patients
  for (const docId of doctorIds) {
    for (const patId of patientIds) {
      const existingLink = await access.findOne({ doctorId: docId, patientId: patId });
      if (!existingLink) {
        await access.insertOne({
          _id: `access-${docId}-${patId}`,
          doctorId: docId,
          patientId: patId,
          accessType: 'care',
          createdAt: new Date().toISOString(),
        });
        accessLinksCreated++;
      }
    }
  }

  // Seed initial sample record for Aarav Rao (sample_hypertension document & events)
  const existingAaravDoc = await documents.findOne({ patientId: 'pat-aarav-rao' });
  if (!existingAaravDoc) {
    const docId = 'doc-aarav-hypertension-1';
    await documents.insertOne({
      _id: docId,
      patientId: 'pat-aarav-rao',
      fileName: 'sample_hypertension.pdf',
      fileSize: 729,
      mimeType: 'application/pdf',
      uploadedBy: 'pat-aarav-rao',
      uploadedAt: '2026-08-15T10:00:00.000Z',
      analysisStatus: 'completed',
      documentDate: '2026-08-15',
      documentType: 'follow_up_note',
      patientName: 'Aarav Rao',
      patientAgeOrDob: '45 M',
      provider: 'Dr. Ananya Sharma',
      facility: 'MediChron Health Center',
      pageCount: 1,
      eventsCount: 1,
    });

    await events.insertOne({
      _id: 'ev-aarav-htn-1',
      patientId: 'pat-aarav-rao',
      documentId: docId,
      date: '2026-08-15',
      datePrecision: 'day',
      eventType: 'follow_up',
      title: 'Follow-up Clinical Visit — Hypertension Management',
      symptoms: [],
      diagnoses: [{ text: 'Hypertension', certainty: 'confirmed' }],
      tests: [{ name: 'Blood Pressure', resultValue: '142/90', unit: 'mmHg', status: 'documented' }],
      medications: [
        { name: 'Amlodipine', dose: '5 mg', frequency: 'once daily', status: 'started' },
      ],
      treatments: ['Blood pressure monitoring', 'Lifestyle modification'],
      sourceDocument: 'sample_hypertension.pdf',
      sourcePage: 1,
      evidenceText: '15 August 2026 Patient presented for follow-up. Diagnosis: Hypertension. Medication: Amlodipine 5 mg once daily.',
      confidence: 0.98,
      createdAt: '2026-08-15T10:05:00.000Z',
    });
  }

  return { doctorsCreated, patientsCreated, accessLinksCreated };
}

// Standalone execution for `npm run seed`
async function runStandaloneSeed() {
  console.log('🌱 Starting MediChron database seed...');
  await connectToDatabase();
  const result = await seedDatabase();
  console.log(`✅ Seed complete!
- Doctors created: ${result.doctorsCreated} (target: 2)
- Patients created: ${result.patientsCreated} (target: 5)
- Doctor-Patient links created: ${result.accessLinksCreated} (target: 10)`);
  process.exit(0);
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runStandaloneSeed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
