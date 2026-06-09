'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Terminal,
  Cpu
} from 'lucide-react';
import { useChat, Citation } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';

// Suggested questions to make the empty state look premium and interactive
const SUGGESTED_QUESTIONS = [
  'What is this application about?',
  'How do I upload new documents?',
  'What kind of files are supported for ingestion?',
  'Explain how the RAG model answers my questions.',
];

export default function ChatContainer() {
  const { user } = useAuth();
  const { messages, sendMessage, isPending, clearChat, sessionId } = useChat();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Track open citations states by message ID
  const [openCitations, setOpenCitations] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const toggleCitations = (messageId: string) => {
    setOpenCitations((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleSuggestClick = (question: string) => {
    setInput(question);
  };

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-73px)] w-full max-w-5xl mx-auto px-6 py-6 overflow-hidden relative z-10 selection:bg-purple-500/30 selection:text-white">
      {/* Decorative background glows */}
      <div className="absolute top-[10%] right-[-10%] w-[300px] h-[300px] bg-sky-500/5 rounded-full blur-[80px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[90px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2.5s' }} />

      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black bg-linear-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
            AI Knowledge Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-light">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            Grounded Semantic Search
            {sessionId && (
              <span className="text-slate-500 border-l border-white/10 pl-2 font-mono text-[10px]">
                ID: {sessionId.substring(0, 8)}
              </span>
            )}
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/20 text-slate-300 rounded-xl transition-all cursor-pointer hover:scale-102"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Thread</span>
          </button>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-24 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 ? (
          /* Empty/Welcome State */
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto h-full space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse-glow" />
              <div className="relative w-14 h-14 rounded-2xl bg-linear-to-tr from-sky-500 to-purple-500 flex items-center justify-center shadow-lg shadow-sky-500/10 border border-white/10">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-100 mb-2">
                Ask anything about your documents
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed font-light">
                Submit questions based on your ingested source materials. EchoDocs will synthesize
                answers with precise source citations.
              </p>
            </div>

            {/* Suggested Questions Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestClick(question)}
                  className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-sky-500/20 rounded-2xl text-xs text-slate-300 hover:text-white transition-all text-left group flex items-start gap-3 cursor-pointer shadow-sm hover:shadow-[0_4px_15px_rgba(56,189,248,0.05)] hover:scale-[1.01]"
                >
                  <Sparkles className="w-4 h-4 text-sky-500 mt-0.5 opacity-60 group-hover:opacity-100 group-hover:scale-115 transition-all shrink-0" />
                  <span className="font-light leading-normal">{question}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Thread */
          <div className="space-y-6">
            {messages.map((message) => {
              const isUser = message.sender === 'user';
              const showCitations = openCitations[message.id];
              const hasCitations = message.citations && message.citations.length > 0;
              const isCopied = copiedId === message.id;

              // Hide empty placeholder AI messages from rendering empty bubbles
              if (!isUser && !message.text && !hasCitations && !message.isNotFound && !message.isSystemError) {
                return null;
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-in fade-in duration-300`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs shadow-md border ${
                        isUser
                          ? 'bg-linear-to-tr from-sky-400 to-sky-500 text-slate-950 border-sky-400/20'
                          : message.isSystemError
                          ? 'bg-linear-to-tr from-rose-500 to-pink-600 text-white border-rose-400/20'
                          : 'bg-linear-to-tr from-purple-500 to-pink-500 text-white border-purple-400/20'
                      }`}
                    >
                      {isUser ? user?.email?.[0].toUpperCase() || 'U' : 'AI'}
                    </div>

                    {/* Bubble Content */}
                    <div className="flex flex-col gap-2">
                      <div
                        className={`rounded-2xl px-4.5 py-3.5 border backdrop-blur-md ${
                          isUser
                            ? 'bg-sky-500/5 border-sky-500/15 text-sky-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]'
                            : message.isSystemError
                            ? 'bg-rose-500/5 border-rose-500/15 text-rose-200'
                            : message.isNotFound
                            ? 'bg-amber-500/5 border-amber-500/10 text-slate-300'
                            : 'bg-white/[0.02] border-white/5 text-slate-100'
                        }`}
                      >
                        {/* If Not Found visual treatment */}
                        {!isUser && message.isNotFound && !message.isSystemError && (
                          <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-amber-500 text-[10px] font-bold uppercase tracking-wide">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            No documentation match found
                          </div>
                        )}

                        {/* If System Error visual treatment */}
                        {!isUser && message.isSystemError && (
                          <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wide">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Service Unavailable
                          </div>
                        )}

                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-light">
                          {isUser || !message.citations || message.citations.length === 0
                            ? message.text
                            : message.text.split(/(\[\d+\])/g).map((part, index) => {
                                const match = part.match(/^\[(\d+)\]$/);
                                if (match) {
                                  const citationIndex = parseInt(match[1], 10) - 1;
                                  const citation = message.citations?.[citationIndex];
                                  if (citation) {
                                    return (
                                      <span
                                        key={index}
                                        onClick={() => {
                                          setOpenCitations((prev) => ({
                                            ...prev,
                                            [message.id]: true,
                                          }));
                                        }}
                                        className="inline-flex items-center justify-center w-5 h-5 mx-1 text-[9px] font-black bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/20 text-sky-300 rounded-md cursor-pointer transition-all hover:scale-105 select-none align-super font-mono"
                                        title={`Source ${citationIndex + 1}: ${citation.documentName}`}
                                      >
                                        {citationIndex + 1}
                                      </span>
                                    );
                                  }
                                }
                                return part;
                              })}
                        </p>

                        {/* Copy / Actions Bar */}
                        {!isUser && !message.isSystemError && (
                          <div className="flex justify-end gap-2 mt-3 pt-2.5 border-t border-white/5">
                            <button
                              onClick={() => handleCopy(message.text, message.id)}
                              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 rounded-lg transition-all cursor-pointer"
                              title="Copy Answer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Collapsible Sources / Citations Section */}
                      {!isUser && hasCitations && message.citations && (
                        <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-900/10 backdrop-blur-sm">
                          <button
                            onClick={() => toggleCitations(message.id)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all text-left cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                              Sources Grounded ({message.citations.length})
                            </span>
                            {showCitations ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {showCitations && (
                            <div className="p-3.5 border-t border-white/5 divide-y divide-white/5 space-y-2.5 max-h-60 overflow-y-auto">
                              {message.citations.map((citation: Citation, index: number) => (
                                <div key={index} className="pt-2.5 first:pt-0 text-xs">
                                  <div className="font-bold text-sky-400 flex items-center gap-1.5 mb-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                    {citation.documentName}
                                  </div>
                                  <p className="text-slate-400 bg-slate-950/40 border border-white/5 rounded-xl p-3 font-mono italic leading-relaxed whitespace-pre-wrap text-[11px] font-light">
                                    &ldquo;{citation.excerpt}&rdquo;
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        {isPending && (messages.length === 0 || messages[messages.length - 1].sender !== 'ai' || !messages[messages.length - 1].text) && (
          <div className="flex justify-start w-full animate-pulse">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-400/20 text-purple-400 shrink-0 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-4.5 py-3.5 flex flex-col gap-2 backdrop-blur-md">
                <span className="text-xs text-purple-400 font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  Parsing vector index response...
                </span>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar sticking to bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/60 backdrop-blur-lg border-t border-white/5 py-4 px-4 md:px-6 shrink-0 z-20">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents... (Press Enter)"
              rows={1}
              disabled={isPending}
              className="w-full bg-slate-900/40 hover:bg-slate-900/60 focus:bg-slate-900/80 border border-white/10 focus:border-sky-500/50 rounded-2xl pl-4 pr-14 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500/20 transition-all resize-none shadow-inner min-h-[50px] max-h-32 scrollbar-thin"
              style={{ height: 'auto' }}
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="absolute right-2.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center shadow-md shadow-sky-500/10 hover:scale-102"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2 px-2 font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-slate-500" />
              Verified query execution
            </span>
            <span>Shift + Enter for newline</span>
          </div>
        </div>
      </div>
    </main>
  );
}

