import React from 'react';
import {
  FileText,
  FileCheck,
  Calendar,
  Building,
  User,
  ExternalLink,
  Upload,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/dates';

export const RecordsScreen: React.FC = () => {
  const { documents, setSourceViewerState, setScreen, patientIssues } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <FileText className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Uploaded Medical Records ({documents.length})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Source documents, metadata extraction status, and evidence viewer
            </p>
          </div>
        </div>

        <button
          onClick={() => setScreen('upload')}
          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload More Records</span>
        </button>
      </div>

      {/* Patient Consistency Warning if any */}
      {patientIssues.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Patient-Consistency Notice: </span>
            Documents reflect slight name variations across facilities (
            {patientIssues[0].values.slice(0, 2).map((v) => `"${v.value}"`).join(' vs ')}
            ). Review before relying on this timeline.
          </div>
        </div>
      )}

      {/* Documents Grid / Table */}
      <div className="grid grid-cols-1 gap-3">
        {documents.map((doc, idx) => (
          <div
            key={doc.id}
            onClick={() => setSourceViewerState({ docId: doc.id })}
            className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0 mt-0.5 group-hover:bg-teal-100 transition-colors">
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-teal-900 transition-colors">
                    {doc.fileName}
                  </h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.documentType.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ✓ {doc.extractionStatus}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(doc.documentDate)}
                  </span>
                  {doc.facility && (
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {doc.facility}
                    </span>
                  )}
                  {doc.provider && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {doc.provider}
                    </span>
                  )}
                  <span>· {doc.pageCount || 1} pg</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <div className="text-xs font-bold text-slate-900 font-mono">
                  {doc.eventCount} events
                </div>
                <div className="text-[10px] text-slate-400">extracted facts</div>
              </div>

              <button
                className="px-3 py-1.5 rounded-lg bg-slate-50 group-hover:bg-teal-50 group-hover:text-teal-800 text-slate-600 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>View Paper</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
