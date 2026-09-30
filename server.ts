import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Multer memory storage for direct file buffer handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per file
    files: 12, // max 12 files
  },
});

// Server-side Gemini initialization with required User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    liveAiAvailable: !!ai,
    model: 'gemini-3.8-flash',
  });
});

const EXTRACTION_SYSTEM_INSTRUCTION = `You are a medical-record information extraction system.
Analyze ONLY the supplied document.
Extract all events in chronological order if dated.
Do not invent facts. Never hallucinate.
Preserve uncertainty.

RULES:
1. Extract only what is explicitly written in the document. Never invent or guess dates, diagnoses, medications, doses, frequencies, lab values, units, providers, facilities, or page numbers. If a field is not explicitly present, use null or an empty array.
2. Every event MUST include evidenceText: an exact, verbatim quote from the document (<=300 characters) that supports it. If you cannot quote it, set evidenceText to null, evidenceBasis to 'uncertain' and confidence below 0.5.
3. Preserve uncertainty. Wording such as '?', 'suspected', 'possible', 'rule out', 'probable' -> certainty 'suspected'. 'History of' -> 'history'. Never upgrade uncertainty into fact.
4. Negated or absent findings ('no complaints', 'denies fever', 'denies chest pain') are NOT symptoms. Do not list them as symptoms.
5. Dates: return ISO format (YYYY-MM-DD). If only month/year is given use YYYY-MM or YYYY and set datePrecision accordingly ('day', 'month', 'year', 'unknown'). Resolve relative dates ('3 weeks ago', 'in 6 weeks') ONLY if the document date is explicit, set dateBasis 'relative_to_document_date', and lower confidence slightly. If no date can be determined, set date null, datePrecision 'unknown', dateBasis 'unknown'. Ambiguous formats (e.g. 03/04/2025) -> keep your best reading only if the document context disambiguates; otherwise null with low confidence.
6. Lab results: copy value, unit, reference range and any flag EXACTLY as printed. Do not convert units. Do not label anything abnormal yourself; reportFlag is only what the report printed (e.g. 'HIGH', 'LOW', 'CRITICAL', 'NORMAL').
7. Medications: record dose, frequency, route, duration only if written. status: 'started' if newly started/prescribed, 'changed' if dose/frequency modified, 'continued' if told to continue, 'stopped' if discontinued, 'listed' if merely present in a medication list, else 'unspecified'. Provide normalizedName as the lowercase generic drug name written in the document (e.g. 'metformin', 'lisinopril').
8. Do not link a symptom to a cause or medication unless the document explicitly states the link.
9. Granularity: create one event per distinct documented occurrence:
   - 'visit': encounter or consultation (with documented symptoms)
   - 'diagnosis': documented diagnosis or problem
   - 'test': laboratory or diagnostic test report
   - 'medication': medication start, change, stop, or continuation
   - 'treatment': non-drug procedure, treatment, or clinical counselling
   - 'follow_up': documented follow-up instruction or plan
10. If text is illegible, write '[illegible]' where needed, lower confidence, and explain in confidenceReason. Ignore non-medical content (disclaimers, headers, footer boilerplate).
11. Extract document-level metadata: documentType, documentDate, patientName and patientAgeOrDob exactly as written (or null), provider, facility, pageCount, and sourcePage per event.
12. If the document contains no medical events, return an empty events array.
13. Output JSON only, conforming strictly to the responseSchema.`;

const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document: {
      type: Type.OBJECT,
      properties: {
        documentType: {
          type: Type.STRING,
          description:
            'consultation_note | discharge_summary | prescription | lab_report | diagnostic_report | imaging_report | follow_up_note | referral | other',
        },
        documentDate: {
          type: Type.STRING,
          description: 'ISO string (YYYY-MM-DD) or null',
        },
        documentDateBasis: {
          type: Type.STRING,
          description: 'explicit | unknown',
        },
        patientName: { type: Type.STRING, description: 'patient name as written in document or null' },
        patientAgeOrDob: { type: Type.STRING, description: 'patient age or DOB as written or null' },
        provider: { type: Type.STRING, description: 'clinician name or null' },
        facility: { type: Type.STRING, description: 'clinic or hospital name or null' },
        pageCount: { type: Type.INTEGER, description: 'detected page count or 1' },
      },
      required: ['documentType', 'documentDateBasis'],
    },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'YYYY-MM-DD or YYYY-MM or null' },
          datePrecision: { type: Type.STRING, description: 'day | month | year | unknown' },
          dateBasis: {
            type: Type.STRING,
            description: 'explicit | relative_to_document_date | document_date | unknown',
          },
          eventType: {
            type: Type.STRING,
            description: 'visit | test | diagnosis | medication | treatment | follow_up | other',
          },
          title: { type: Type.STRING, description: 'concise factual title under 80 chars' },
          provider: { type: Type.STRING },
          facility: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          diagnoses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                certainty: {
                  type: Type.STRING,
                  description: 'confirmed | suspected | history | unspecified',
                },
              },
              required: ['text', 'certainty'],
            },
          },
          tests: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                normalizedName: { type: Type.STRING },
                status: { type: Type.STRING, description: 'ordered | resulted' },
                resultValue: { type: Type.STRING },
                unit: { type: Type.STRING },
                referenceRange: { type: Type.STRING },
                reportFlag: { type: Type.STRING },
                resultText: { type: Type.STRING },
              },
              required: ['name', 'normalizedName', 'status'],
            },
          },
          medications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                normalizedName: { type: Type.STRING },
                dose: { type: Type.STRING },
                frequency: { type: Type.STRING },
                route: { type: Type.STRING },
                duration: { type: Type.STRING },
                status: {
                  type: Type.STRING,
                  description: 'started | continued | changed | stopped | listed | unspecified',
                },
                statusNote: { type: Type.STRING },
              },
              required: ['name', 'normalizedName', 'status'],
            },
          },
          treatments: { type: Type.ARRAY, items: { type: Type.STRING } },
          followUp: {
            type: Type.OBJECT,
            properties: {
              plannedInterval: { type: Type.STRING },
              plannedDate: { type: Type.STRING },
              purpose: { type: Type.STRING },
            },
          },
          notes: { type: Type.STRING },
          sourcePage: { type: Type.INTEGER },
          evidenceText: {
            type: Type.STRING,
            description: 'VERBATIM quote <=300 characters or null',
          },
          confidence: { type: Type.NUMBER, description: '0 to 1' },
          confidenceReason: { type: Type.STRING },
          evidenceBasis: { type: Type.STRING, description: 'explicit | inferred | uncertain' },
        },
        required: [
          'eventType',
          'title',
          'confidence',
          'confidenceReason',
          'evidenceBasis',
          'symptoms',
          'diagnoses',
          'tests',
          'medications',
          'treatments',
        ],
      },
    },
  },
  required: ['document', 'events'],
};

// Helper to call Gemini with retries and exponential backoff
async function callGeminiExtraction(
  aiClient: GoogleGenAI,
  mimeType: string,
  base64Data: string,
  fileName: string
): Promise<any> {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Server] Calling Gemini model ${model} for ${fileName} (attempt ${attempt})...`);
        const response = await aiClient.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: `Document Name: ${fileName}\n\nYou are a medical-record information extraction system. Analyze ONLY this supplied document. Extract all factual clinical events, dates, metadata, diagnoses, medications, tests, and exact verbatim evidence quotes as specified in the instructions.`,
              },
            ],
          },
          config: {
            systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: EXTRACTION_SCHEMA,
            temperature: 0,
          },
        });

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);
        return parsed;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Server] Model ${model} attempt ${attempt} failed for ${fileName}:`, errMsg);

        // If 429 RESOURCE_EXHAUSTED or quota error, immediately switch to next model
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
          console.warn(`[Server] Quota limit on ${model}, immediately falling back to next available model...`);
          break;
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  throw lastError || new Error(`Gemini analysis failed for ${fileName}`);
}

// Multi-Document PDF/Image Analysis API endpoint using multer
app.post('/api/analyze-records', upload.array('files', 12), async (req, res) => {
  try {
    if (!ai) {
      console.error('[Server] Gemini API not configured on server.');
      return res.status(503).json({
        success: false,
        error: 'Gemini API is not configured on the server. Please check GEMINI_API_KEY in environment secrets.',
      });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded. Please attach at least one PDF or image document.',
      });
    }

    console.log(`[Server] Received ${files.length} uploaded document(s) for real Gemini extraction.`);

    const processedDocuments: any[] = [];
    const extractedEvents: any[] = [];
    let failureCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = `uploaded-doc-${Date.now()}-${i}`;
      console.log(`[Server] Processing file: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size} bytes`);

      if (!file.buffer || file.size === 0) {
        console.warn(`[Server] File is empty: ${file.originalname}`);
        failureCount++;
        processedDocuments.push({
          id: docId,
          fileName: file.originalname,
          mimeType: file.mimetype || 'application/pdf',
          sizeBytes: file.size,
          documentType: 'other',
          documentDate: null,
          documentDateBasis: 'unknown',
          patientName: null,
          patientAgeOrDob: null,
          provider: null,
          facility: null,
          pageCount: 1,
          extractionStatus: 'failed',
          errorMessage: 'Uploaded file is empty (0 bytes).',
          eventCount: 0,
        });
        continue;
      }

      // Ensure proper MIME type for Gemini PDF / image input
      let mimeType = file.mimetype;
      const lowerName = file.originalname.toLowerCase();
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (lowerName.endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (lowerName.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (lowerName.match(/\.(jpg|jpeg)$/)) {
          mimeType = 'image/jpeg';
        } else {
          mimeType = 'application/pdf';
        }
      }

      const base64Data = file.buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      try {
        const parsed = await callGeminiExtraction(ai, mimeType, base64Data, file.originalname);
        const docMeta = parsed.document || {};
        const eventsList = parsed.events || [];

        console.log(`[Server] Gemini extraction successful for ${file.originalname}: ${eventsList.length} events extracted.`);

        const docRecord = {
          id: docId,
          fileName: file.originalname,
          mimeType,
          sizeBytes: file.size,
          documentType: docMeta.documentType || 'other',
          documentDate: docMeta.documentDate || null,
          documentDateBasis: docMeta.documentDateBasis || 'unknown',
          patientName: docMeta.patientName || null,
          patientAgeOrDob: docMeta.patientAgeOrDob || null,
          provider: docMeta.provider || null,
          facility: docMeta.facility || null,
          pageCount: docMeta.pageCount || 1,
          extractionStatus: 'done',
          eventCount: eventsList.length,
          fileUrl: dataUri,
        };
        processedDocuments.push(docRecord);

        // Convert and tag events with document ID and sourceDocument
        eventsList.forEach((ev: any, evIdx: number) => {
          extractedEvents.push({
            id: `evt-${docId}-${evIdx}`,
            date: ev.date || null,
            datePrecision: ev.datePrecision || 'unknown',
            dateBasis: ev.dateBasis || 'document_date',
            eventType: ev.eventType || 'other',
            title: ev.title || 'Documented occurrence',
            provider: ev.provider || docRecord.provider,
            facility: ev.facility || docRecord.facility,
            symptoms: ev.symptoms || [],
            diagnoses: ev.diagnoses || [],
            tests: ev.tests || [],
            medications: ev.medications || [],
            treatments: ev.treatments || [],
            followUp: ev.followUp || null,
            notes: ev.notes || null,
            sourceDocumentId: docId,
            sourceDocument: file.originalname,
            sourcePage: ev.sourcePage || 1,
            evidenceText: ev.evidenceText || null,
            confidence: typeof ev.confidence === 'number' ? ev.confidence : 0.85,
            confidenceReason: ev.confidenceReason || 'Extracted with Gemini from uploaded document',
            evidenceBasis: ev.evidenceBasis || 'explicit',
            relatedEventIds: [],
            corroboratedBy: [],
            review: { state: 'unreviewed' },
          });
        });
      } catch (geminiErr: any) {
        failureCount++;
        console.error(`[Server] Gemini extraction failed for ${file.originalname}:`, geminiErr);
        processedDocuments.push({
          id: docId,
          fileName: file.originalname,
          mimeType,
          sizeBytes: file.size,
          documentType: 'other',
          documentDate: null,
          documentDateBasis: 'unknown',
          patientName: null,
          patientAgeOrDob: null,
          provider: null,
          facility: null,
          pageCount: 1,
          extractionStatus: 'failed',
          errorMessage: geminiErr.message || 'Gemini document analysis failed',
          eventCount: 0,
          fileUrl: dataUri,
        });
      }
    }

    if (failureCount === files.length && extractedEvents.length === 0) {
      return res.status(500).json({
        success: false,
        error:
          processedDocuments[0]?.errorMessage ||
          'Failed to extract medical events from the uploaded document(s). Please verify the files are valid PDFs or images.',
        documents: processedDocuments,
        events: [],
      });
    }

    res.json({
      success: true,
      documents: processedDocuments,
      events: extractedEvents,
    });
  } catch (err: any) {
    console.error('[Server] Critical error in /api/analyze-records:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error while processing uploaded records',
    });
  }
});

// Single Document Extraction API endpoint (text or base64)
app.post('/api/extract', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured. Live extraction unavailable.',
        fallback: true,
      });
    }

    const { fileName, mimeType, base64Data, textContent } = req.body;

    if (!base64Data && !textContent) {
      return res.status(400).json({ error: 'Missing document content (base64Data or textContent)' });
    }

    const parts: any[] = [];

    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: base64Data,
        },
      });
    }

    parts.push({
      text: `Document Name: ${fileName || 'Medical Record'}\n\n${
        textContent ? `Document Text:\n${textContent}` : 'Extract all medical events from this document according to instructions.'
      }`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: EXTRACTION_SCHEMA,
        temperature: 0,
      },
    });

    const rawJson = response.text || '{}';
    const parsed = JSON.parse(rawJson);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error during extraction:', err);
    res.status(500).json({
      error: err.message || 'Failed to extract document',
      success: false,
    });
  }
});

// Handoff Summary API endpoint
app.post('/api/handoff', async (req, res) => {
  try {
    const { events, conflicts, gaps, openLoops } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API not configured. Falling back to deterministic summary.',
        fallback: true,
      });
    }

    const prompt = `Write a concise factual handoff summary using ONLY the provided structured medical data.
Use the vocabulary 'documented', 'the record states', 'Potential document conflict', 'No uploaded records found for this period.'
Do NOT interpret, diagnose, recommend, or predict.
Never use words like: 'improved', 'worsened', 'abnormal', 'likely', 'concerning', 'non-compliant', 'missed follow-up', 'should', 'recommend'.
Every bullet must cite sourceEventIds from the data.

Structured Data:
Events: ${JSON.stringify(events?.slice(0, 40) || [])}
Conflicts: ${JSON.stringify(conflicts || [])}
Gaps: ${JSON.stringify(gaps || [])}
Open Loops: ${JSON.stringify(openLoops || [])}

Return JSON with format:
{
  "sections": [
    {
      "heading": string,
      "bullets": [
        { "text": string, "sourceEventIds": [string] }
      ]
    }
  ],
  "disclaimer": "Generated from uploaded records for organization and review. Not medical advice. Does not diagnose, prescribe, or recommend treatment."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        sections: parsed.sections || [],
        disclaimer:
          'Generated from uploaded records for organization and review. Not medical advice. Does not diagnose, prescribe, or recommend treatment.',
      },
    });
  } catch (err: any) {
    console.error('Error generating handoff:', err);
    res.status(500).json({
      error: err.message,
      fallback: true,
    });
  }
});

// Ask Records API endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const { question, events } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API not configured.',
        fallback: true,
      });
    }

    const systemInstruction = `You answer questions strictly and solely from the provided structured medical records events.
RULES:
1. If the question asks for medical advice, medical interpretation, diagnosis, prognosis, or future treatment recommendations, respond EXACTLY:
"I can only report what the uploaded records document. For medical questions, please consult a clinician."
Set answerable to false.
2. If the information requested is not present in the events, respond EXACTLY:
"This isn't documented in the uploaded records."
Set answerable to false.
3. If documented, provide a concise, factual answer using the word 'documented' and list the relevant citedEventIds.
4. Output JSON only: { "answerable": boolean, "answer": string, "citedEventIds": string[] }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Question: ${question}\n\nStructured Events:\n${JSON.stringify(events || [])}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error answering question:', err);
    res.status(500).json({
      error: err.message,
      fallback: true,
    });
  }
});

// In production serve dist, otherwise in dev let Vite handle frontend
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`MediChron AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
