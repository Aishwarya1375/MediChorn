import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  HelpCircle,
  ExternalLink,
  Shield,
  Loader2,
  Bot,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRECOMPUTED_ASK_QUESTIONS } from '../lib/demoData';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citedEventIds?: string[];
  timestamp: string;
}

export const AskRecordsScreen: React.FC = () => {
  const { events, liveAiAvailable, setSelectedEventId, isDemoMode } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "I answer questions strictly and solely from what is explicitly documented in the uploaded medical records. I do not provide medical advice, diagnosis, or clinical interpretations. How can I assist your review?",
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = isDemoMode
    ? PRECOMPUTED_ASK_QUESTIONS.map((q) => q.question)
    : [
        'What medications are documented?',
        'What diagnoses were documented in this record?',
        'What were the latest laboratory or test results?',
        'Are there any documented follow-up instructions or orders?',
      ];

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // 1. Check precomputed offline questions ONLY if in Demo Mode
    if (isDemoMode) {
      const precomputed = PRECOMPUTED_ASK_QUESTIONS.find(
        (q) => q.question.toLowerCase().trim() === questionText.toLowerCase().trim()
      );

      if (precomputed) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-resp-${Date.now()}`,
              sender: 'assistant',
              text: precomputed.answer,
              citedEventIds: precomputed.citedEventIds,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsLoading(false);
        }, 400);
        return;
      }
    }

    // 2. Check if medical advice / opinion is requested
    const adviceKeywords = ['should i', 'do you recommend', 'what treatment should', 'is this bad', 'diagnose me', 'will i get', 'what do you think'];
    const asksAdvice = adviceKeywords.some((kw) => questionText.toLowerCase().includes(kw));

    if (asksAdvice) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: "I can only report what the uploaded records document. For medical questions, please consult a clinician.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsLoading(false);
      }, 300);
      return;
    }

    // 3. Call `/api/ask` for live document reasoning
    if (liveAiAvailable && events.length > 0) {
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: questionText, events }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-resp-${Date.now()}`,
              sender: 'assistant',
              text: data.data.answer,
              citedEventIds: data.data.citedEventIds,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error asking records:', err);
      }
    }

    // Default bounded response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: "This isn't documented in the uploaded records.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <MessageSquare className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Ask the Uploaded Records
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Factual Q&A bounded strictly to documented facts · Zero clinical advice
            </p>
          </div>
        </div>

        <div className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          Evidence Bounded
        </div>
      </div>

      {/* Suggested Questions Bar */}
      <div className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Suggested Inquiries:
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              className="text-xs text-slate-700 bg-white hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 border border-slate-200 px-3 py-1.5 rounded-lg text-left transition-colors shadow-2xs cursor-pointer"
            >
              &quot;{q}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200 mb-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-teal-700 border border-slate-200 shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-teal-700 text-white font-medium shadow-xs rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Clickable Cited Events */}
                {msg.citedEventIds && msg.citedEventIds.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Cited Proof:
                    </span>
                    {msg.citedEventIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => setSelectedEventId(id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                      >
                        <span>event #{id}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`mt-1 text-[10px] text-right ${
                    isUser ? 'text-teal-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Consulting extracted records...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(inputQuery);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a factual question about documented medications, tests, or visits..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white shadow-2xs"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
