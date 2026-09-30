import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileImage,
  Trash2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const UploadScreen: React.FC = () => {
  const { startLiveProcessing, runDemoProcessing } = useApp();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 12;
  const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setErrorMsg(null);
    const valid: File[] = [];

    if (selectedFiles.length + newFiles.length > MAX_FILES) {
      setErrorMsg(`Maximum ${MAX_FILES} files can be analyzed in one batch. Please select fewer files.`);
      return;
    }

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const lowerName = file.name.toLowerCase();
      const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
      const isImage =
        file.type.startsWith('image/') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png');

      if (!isPdf && !isImage) {
        setErrorMsg(`Unsupported file type: "${file.name}". Please upload PDF, JPG, JPEG, or PNG files only.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setErrorMsg(`File exceeds 20 MB limit: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one medical document (PDF or image) to analyze.');
      return;
    }
    // Sends the actual File objects via FormData to the backend
    startLiveProcessing(selectedFiles);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) validateAndAddFiles(e.target.files);
        }}
      />

      {/* Header with Mode Distinction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            DOCUMENT MODE: Real Document Analysis
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Analyze Medical Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload consultation notes, discharge summaries, prescriptions, or lab reports in PDF or image format.
          </p>
        </div>

        <button
          onClick={runDemoProcessing}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Try Demo Data</span>
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-teal-500 bg-teal-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-slate-400 bg-white shadow-2xs'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-200/60 shadow-2xs">
          <Upload className="w-7 h-7" />
        </div>

        <h2 className="text-base sm:text-lg font-bold text-slate-800">
          Drop your medical PDF or image(s) here
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
          Supports native PDFs, scanned clinical documents, JPG, JPEG, and PNG (up to 12 files, max 20 MB each)
        </p>

        {/* Action Button Row inside Upload Card */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD RECORDS</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              runDemoProcessing();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>TRY DEMO</span>
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-400">
          <span>✓ Consultation Notes</span>
          <span>·</span>
          <span>✓ Lab Reports</span>
          <span>·</span>
          <span>✓ Discharge Summaries</span>
          <span>·</span>
          <span>✓ Prescriptions</span>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Selected Documents ({selectedFiles.length} of {MAX_FILES})
            </h3>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-500 hover:text-rose-600 underline cursor-pointer p-1"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-600 shrink-0">
                    {file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf') ? (
                      <FileText className="w-4 h-4 text-rose-600" />
                    ) : (
                      <FileImage className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(0)} KB ·{' '}
                      {file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : file.type.split('/')[1]?.toUpperCase() || 'IMAGE'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  aria-label={`Remove ${file.name}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add More Files</span>
            </button>

            <button
              onClick={handleStartAnalysis}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <span>ANALYZE RECORDS ({selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900">Privacy Notice: </span>
          Uploaded files are processed securely by Google&apos;s Gemini API for structured medical extraction and are not permanently stored by this app.
        </div>
      </div>
    </div>
  );
};
