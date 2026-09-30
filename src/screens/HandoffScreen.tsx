import React, { useState } from 'react';
import {
  FileCheck,
  Copy,
  Printer,
  Download,
  Share2,
  Sparkles,
  Check,
  ExternalLink,
  Shield,
  Loader2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HandoffScreen: React.FC = () => {
  const {
    handoffSummary,
    refreshHandoffSummary,
    isGeneratingHandoff,
    setSelectedEventId,
    patientInfo,
    events,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const generateFullText = () => {
    let text = `CLINICAL HANDOFF SUMMARY - MEDICHRON AI\n`;
    text += `Patient: ${patientInfo.name} (${patientInfo.ageOrDob}) | ID: ${patientInfo.id}\n`;
    text += `Generated: ${new Date(handoffSummary.generatedAt).toLocaleDateString()}\n\n`;

    handoffSummary.sections.forEach((sec) => {
      text += `=== ${sec.heading.toUpperCase()} ===\n`;
      sec.bullets.forEach((b) => {
        text += `• ${b.text}\n`;
      });
      text += `\n`;
    });

    text += `DISCLAIMER: ${handoffSummary.disclaimer}\n`;
    return text;
  };

  const handleCopy = () => {
    const text = generateFullText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareOrDownload = async () => {
    const text = generateFullText();
    const title = `MediChron AI Handoff - ${patientInfo.name}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to download
        console.log('Share dismissed, falling back to download', err);
      }
    }

    // Fallback: Download formatted plain text summary
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medichron_handoff_${patientInfo.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(handoffSummary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `medichron_handoff_${patientInfo.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print space-y-4 border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              <FileCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sourced Clinical Handoff Summary
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured synopsis generated strictly from documented facts with clickable citations
              </p>
            </div>
          </div>
        </div>

        {/* Mobile & Desktop Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Prominent Full-Width Generate Button */}
          <button
            onClick={refreshHandoffSummary}
            disabled={isGeneratingHandoff}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            {isGeneratingHandoff ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-teal-200" />
            )}
            <span>GENERATE HANDOFF SUMMARY</span>
          </button>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'COPY SUMMARY'}</span>
            </button>

            <button
              onClick={handleShareOrDownload}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              {shareSuccess ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4 text-slate-500" />
              )}
              <span>{shareSuccess ? 'Saved / Shared!' : 'SHARE / DOWNLOAD'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="col-span-1 hidden sm:flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="col-span-1 hidden sm:flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sourced Handoff Document Paper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8 space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight uppercase">
                MediChron AI Handoff Record
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                VERIFIED CITATIONS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Source Record Synthesis · Explainable Clinical Timeline
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 font-mono">
            <div>Patient: <strong className="text-slate-900 font-sans">{patientInfo.name}</strong></div>
            <div>{patientInfo.ageOrDob} · ID: {patientInfo.id}</div>
            <div>Generated: {new Date(handoffSummary.generatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Summary Sections */}
        {isGeneratingHandoff ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-700 mx-auto" />
            <p className="text-xs text-slate-500">
              Synthesizing structured clinical occurrences and source citations...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {handoffSummary.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2.5 print-break-inside-avoid">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 flex items-center justify-between">
                  <span>{section.heading}</span>
                </h3>

                <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-teal-600 mt-1 shrink-0 font-bold">•</span>
                      <div className="flex-1">
                        <span>{bullet.text}</span>

                        {/* Citation Chips */}
                        {bullet.sourceEventIds && bullet.sourceEventIds.length > 0 && (
                          <span className="inline-flex flex-wrap items-center gap-1.5 ml-2 mt-1 sm:mt-0">
                            {bullet.sourceEventIds.map((evId, cIdx) => {
                              const ev = events.find((e) => e.id === evId);
                              return (
                                <button
                                  key={cIdx}
                                  onClick={() => setSelectedEventId(evId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200/80 text-[11px] font-mono transition-colors cursor-pointer"
                                  title={ev ? `Document: ${ev.sourceDocument} · Page ${ev.sourcePage ?? 1}` : 'Source Event'}
                                >
                                  <span>{ev ? ev.sourceDocument.split(' ')[0] : 'Event'}</span>
                                  <span className="text-slate-400">p.{ev?.sourcePage ?? 1}</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                </button>
                              );
                            })}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Shield className="w-4 h-4 text-teal-700" />
            <span>Documented Evidence Notice</span>
          </div>
          <p className="leading-relaxed">
            {handoffSummary.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
