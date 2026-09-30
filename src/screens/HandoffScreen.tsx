import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Copy,
  Download,
  Share2,
  Sparkles,
  Check,
  ExternalLink,
  Shield,
  Loader2,
  AlertTriangle,
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateHandoffPdf, GeneratedPdfResult } from '../lib/pdfGenerator';

export const HandoffScreen: React.FC = () => {
  const {
    handoffSummary,
    refreshHandoffSummary,
    isGeneratingHandoff,
    setSelectedEventId,
    patientInfo,
    patientEmail,
    setPatientEmail,
    sendSummaryEmail,
    emailConfig,
    events,
    currentUser,
    documents,
    conflicts,
    gaps,
    stats,
    isDemoMode,
  } = useApp();

  const isPatient = currentUser?.role === 'patient';

  // Email input state (customizable by doctor or patient)
  const [recipientEmail, setRecipientEmail] = useState<string>(() => {
    return patientEmail || (isDemoMode ? 'demo.patient@medichron.test' : '');
  });

  // Keep recipientEmail in sync if patientEmail changes
  useEffect(() => {
    if (patientEmail) {
      setRecipientEmail(patientEmail);
    }
  }, [patientEmail]);

  // Status and PDF Generation States
  const [activePdfResult, setActivePdfResult] = useState<GeneratedPdfResult | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    'idle' | 'sending' | 'success' | 'failed' | 'unconfigured'
  >('idle');
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);
  const [isSummaryReadyCardVisible, setIsSummaryReadyCardVisible] = useState(false);

  // General Notification Banners
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Helper to generate the real PDF in memory and optionally trigger browser download
  const createPdf = (autoDownload: boolean = false): GeneratedPdfResult => {
    const result = generateHandoffPdf({
      patientInfo: {
        ...patientInfo,
        email: recipientEmail,
      },
      isDemoMode,
      currentUser,
      documents,
      events,
      conflicts,
      gaps,
      stats,
      handoffSummary,
      skipAutoDownload: !autoDownload,
    });
    setActivePdfResult(result);
    return result;
  };

  // Dispatch Email Server-Side (no client secrets, real PDF attachment)
  const dispatchEmail = async (pdfBase64: string, pdfFileName: string, targetEmail: string) => {
    setIsEmailSending(true);
    setEmailStatus('sending');
    setEmailStatusMessage(`Sending to ${targetEmail}...`);

    try {
      const res = await sendSummaryEmail({
        patientEmail: targetEmail,
        pdfData: pdfBase64,
        fileName: pdfFileName,
      });

      if (res.success) {
        setEmailStatus('success');
        setEmailStatusMessage(`Sent to ${targetEmail}`);
      } else if (res.unconfigured || res.error === 'Email delivery is not configured.') {
        setEmailStatus('unconfigured');
        setEmailStatusMessage('Email delivery is not configured.');
      } else {
        setEmailStatus('failed');
        setEmailStatusMessage(res.error || 'Unable to send summary email');
      }
    } catch {
      setEmailStatus('failed');
      setEmailStatusMessage('Unable to send summary email');
    } finally {
      setIsEmailSending(false);
    }
  };

  // Primary Action: GENERATE HANDOFF SUMMARY
  const handleGenerateSummary = async () => {
    try {
      // 1. Refresh / synthesize summary from structured record events
      await refreshHandoffSummary();

      // 2. Deterministically generate the vector PDF in memory (no extra Gemini call)
      const pdf = createPdf(false);
      setIsSummaryReadyCardVisible(true);

      const targetEmail = recipientEmail.trim();

      // 3. Workflow routing:
      // - Patient (or Demo Patient flow): Automatically email the generated PDF
      // - Doctor: Show the explicit "Send Summary to Patient" action to avoid accidental disclosure
      if (isPatient || isDemoMode) {
        if (targetEmail) {
          await dispatchEmail(pdf.base64Data, pdf.fileName, targetEmail);
        } else {
          setEmailStatus('failed');
          setEmailStatusMessage('No patient email provided.');
        }
      } else {
        // Doctor flow: PDF is ready, explicit send available
        setEmailStatus('idle');
        setEmailStatusMessage(null);
      }
    } catch (err) {
      console.error('Failed to generate summary or PDF:', err);
    }
  };

  // Direct Standalone PDF Download
  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    try {
      if (activePdfResult) {
        activePdfResult.download();
      } else {
        createPdf(true);
      }
      setDownloadSuccessMessage('Summary PDF downloaded successfully.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Retry or Explicit Email Send
  const handleExplicitSendEmail = async () => {
    const targetEmail = recipientEmail.trim();
    if (!targetEmail) {
      setEmailStatus('failed');
      setEmailStatusMessage('Please enter a valid patient email address.');
      return;
    }

    let pdf = activePdfResult;
    if (!pdf) {
      pdf = createPdf(false);
    }
    await dispatchEmail(pdf.base64Data, pdf.fileName, targetEmail);
  };

  const generateFullText = () => {
    let text = `CLINICAL HANDOFF SUMMARY - MEDICHRON AI\n`;
    text += `Patient: ${patientInfo.name} (${patientInfo.ageOrDob}) | ID: ${patientInfo.id}\n`;
    text += `Patient Contact Email: ${recipientEmail || 'Not documented'}\n`;
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
        console.log('Share dismissed, falling back to download', err);
      }
    }

    // Fallback plain text download
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

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(handoffSummary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `medichron_handoff_${patientInfo.name.replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const currentPdfFileName =
    activePdfResult?.fileName ||
    `MediChron_Handoff_Summary_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="no-print space-y-4 border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              <FileCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {isPatient ? 'My Documented Care Summary' : 'Sourced Clinical Handoff Summary'}
                </h1>
                {isDemoMode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                    DEMO DATA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPatient
                  ? 'A clear summary of care documented in your uploaded records, formatted for personal review or sharing with your doctor.'
                  : 'Structured synopsis generated strictly from documented facts with clickable citations.'}
              </p>
            </div>
          </div>

          {/* Email Service Status Chip */}
          <div className="text-xs shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
            <Mail className="w-3.5 h-3.5 text-teal-600" />
            <span>
              Email Service:{' '}
              <strong className="text-slate-800">
                {emailConfig?.configured
                  ? `${emailConfig.provider || 'Active'}`
                  : 'Not configured'}
              </strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
          {/* GENERATE HANDOFF SUMMARY - Prominent primary trigger */}
          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingHandoff || isEmailSending}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px] disabled:opacity-70"
          >
            {isGeneratingHandoff ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
            ) : (
              <Sparkles className="w-4 h-4 text-teal-200" />
            )}
            <span>GENERATE HANDOFF SUMMARY</span>
          </button>

          {/* DOWNLOAD SUMMARY AS PDF - Prominent full-width button on mobile */}
          <button
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px]"
          >
            {isPdfGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
            ) : (
              <Download className="w-4 h-4 text-teal-300" />
            )}
            <span>DOWNLOAD SUMMARY AS PDF</span>
          </button>

          {/* Secondary Utilities */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'COPY'}</span>
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
              <span>{shareSuccess ? 'Saved!' : 'SHARE'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* PDF Download Success Banner */}
        {downloadSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUMMARY READY / EMAIL STATUS CARD                          */}
        {/* Rendered upon PDF generation                               */}
        {/* ========================================================= */}
        {isSummaryReadyCardVisible && (
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/60 to-white p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  Summary Ready
                </h3>
              </div>

              {isDemoMode ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  DEMO EMAIL — FICTIONAL PATIENT
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500">
                  Live Document Session
                </span>
              )}
            </div>

            {/* Document and Email Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  PDF Document
                </span>
                <div className="font-mono text-slate-900 font-semibold truncate flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{currentPdfFileName}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Selectable-text vector PDF generated from structured records.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Patient Email
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">Direct Inbox Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      setPatientEmail(e.target.value);
                    }}
                    placeholder="patient@email.com"
                    className="w-full text-xs font-mono py-1 px-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900 bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isDemoMode
                    ? 'Default is demo email. You can change to your test email anytime.'
                    : 'The address where the handoff summary PDF attachment will be delivered.'}
                </p>
              </div>
            </div>

            {/* Checklist & Delivery Status */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Processing & Delivery Pipeline
              </div>

              <div className="space-y-1.5 text-xs">
                {/* 1. Summary generated */}
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Summary generated from structured timeline</span>
                </div>

                {/* 2. PDF created */}
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>PDF created (vector text with verbatim citations)</span>
                </div>

                {/* 3. Email Delivery Status */}
                {emailStatus === 'sending' && (
                  <div className="flex items-center gap-2 text-teal-800 font-medium animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-700 shrink-0" />
                    <span>Sending to {recipientEmail}...</span>
                  </div>
                )}

                {emailStatus === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-800 font-medium">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Sent to {recipientEmail}</span>
                  </div>
                )}

                {emailStatus === 'unconfigured' && (
                  <div className="flex items-start gap-2 text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        PDF created successfully, but email could not be sent.
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Email delivery is not configured. (Configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">EMAIL_API_KEY</code> on server to dispatch directly to patient inbox).
                      </div>
                    </div>
                  </div>
                )}

                {emailStatus === 'failed' && (
                  <div className="flex items-start gap-2.5 text-rose-900 bg-rose-50/90 p-3 rounded-xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="font-bold text-xs">
                        ⚠ PDF created successfully, but email delivery could not be completed.
                      </div>
                      <div className="text-[11px] text-rose-800 leading-relaxed bg-white/70 p-2 rounded-lg border border-rose-100 font-mono">
                        {emailStatusMessage || 'Unable to send summary email'}
                      </div>
                      {emailStatusMessage?.includes('aishwaryardeshpande01@gmail.com') && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setRecipientEmail('aishwaryardeshpande01@gmail.com');
                              setPatientEmail('aishwaryardeshpande01@gmail.com');
                            }}
                            className="text-[11px] font-bold text-teal-800 bg-white hover:bg-teal-50 px-2.5 py-1 rounded-md border border-teal-300 shadow-2xs cursor-pointer transition-colors"
                          >
                            Set Recipient to aishwaryardeshpande01@gmail.com & Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Doctor view: awaiting explicit send */}
                {!isPatient && !isDemoMode && emailStatus === 'idle' && (
                  <div className="flex items-center gap-2 text-indigo-900 bg-indigo-50 p-2.5 rounded-lg border border-indigo-200">
                    <User className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>
                      Clinician safeguard: Verify patient email above, then click &quot;Send Summary to Patient&quot; below.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons within Status Card */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              {/* DOWNLOAD PDF - Always available and prominent */}
              <button
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[42px]"
              >
                <Download className="w-4 h-4 text-teal-300" />
                <span>DOWNLOAD PDF</span>
              </button>

              {/* Clinician Send or Patient Retry Email */}
              {!isPatient && !isDemoMode ? (
                <button
                  onClick={handleExplicitSendEmail}
                  disabled={isEmailSending}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[42px] disabled:opacity-60"
                >
                  {isEmailSending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
                  ) : (
                    <Send className="w-4 h-4 text-teal-200" />
                  )}
                  <span>SEND SUMMARY TO PATIENT</span>
                </button>
              ) : (
                (emailStatus === 'failed' || emailStatus === 'unconfigured') && (
                  <button
                    onClick={handleExplicitSendEmail}
                    disabled={isEmailSending}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[42px]"
                  >
                    {isEmailSending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-slate-600" />
                    )}
                    <span>RETRY EMAIL</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* Sourced Handoff Document Paper Preview                     */}
      {/* ========================================================= */}
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
            <div>
              Patient: <strong className="text-slate-900 font-sans">{patientInfo.name}</strong>
            </div>
            <div>{patientInfo.ageOrDob} · ID: {patientInfo.id}</div>
            <div>Email: <span className="text-slate-700">{recipientEmail || 'Not documented'}</span></div>
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
                                  title={
                                    ev
                                      ? `Document: ${ev.sourceDocument} · Page ${ev.sourcePage ?? 1}`
                                      : 'Source Event'
                                  }
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

        {/* Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Shield className="w-4 h-4 text-teal-700" />
            <span>Documented Evidence Notice</span>
          </div>
          <p className="leading-relaxed">{handoffSummary.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
