'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Terminal, 
  Search, 
  CheckCircle, 
  Sparkles, 
  Database,
  FileCode,
  Check
} from 'lucide-react';

interface MockDoc {
  name: string;
  size: string;
  type: 'pdf' | 'md' | 'json';
  status: 'indexed' | 'indexing';
}

const MOCK_DOCS: MockDoc[] = [
  { name: 'auth_service_v2.pdf', size: '2.4 MB', type: 'pdf', status: 'indexed' },
  { name: 'api_endpoints.md', size: '12 KB', type: 'md', status: 'indexed' },
  { name: 'schema.prisma', size: '8 KB', type: 'json', status: 'indexed' },
  { name: 'user_onboarding.pdf', size: '1.1 MB', type: 'pdf', status: 'indexing' },
];

const MOCK_STEPS = [
  {
    query: 'How does the auth token validation work in EchoDocs?',
    answer: 'EchoDocs validates tokens via the NestJS middleware. The cookie-based token is parsed from requests [1], decrypted using the system JWT secret, and checked for expiration [2]. If verified, the user payload is attached to the request context [3].',
    citations: [
      { id: 1, file: 'auth_service_v2.pdf', snippet: 'Line 42: cookies().get("token") is retrieved from incoming request headers.' },
      { id: 2, file: 'auth_service_v2.pdf', snippet: 'Line 88: jwt.verify(token, process.env.JWT_SECRET) validates expiration.' },
      { id: 3, file: 'api_endpoints.md', snippet: 'Line 112: Request context attributes user object from token payload.' }
    ]
  },
  {
    query: 'How is document indexing triggered?',
    answer: 'Documents are processed asynchronously using a queue. When you upload a file, it is stored in database storage [1], and a processing job is dispatched via BullMQ [2]. The worker processes and chunks the content before vector storage [3].',
    citations: [
      { id: 1, file: 'schema.prisma', snippet: 'Line 24: Document model tracks state as UPLOADED or INDEXED.' },
      { id: 2, file: 'auth_service_v2.pdf', snippet: 'Line 210: queue.add("process-doc", { docId }) triggers worker.' },
      { id: 3, file: 'api_endpoints.md', snippet: 'Line 15: Worker reads buffer, chunks text into 500-char intervals.' }
    ]
  }
];

export default function InteractiveDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [queryText, setQueryText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);

  const currentStep = MOCK_STEPS[stepIdx];

  // Simulated typing flow
  useEffect(() => {
    if (!isTyping) return;

    let currentLength = 0;
    const fullQuery = currentStep.query;
    
    const interval = setInterval(() => {
      if (currentLength < fullQuery.length) {
        setQueryText(fullQuery.slice(0, currentLength + 1));
        currentLength++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setIsProcessing(true);

        // Simulated processing time
        setTimeout(() => {
          setIsProcessing(false);
          setShowResult(true);

          // Hold state, then move to next query
          setTimeout(() => {
            setShowResult(false);
            setIsTyping(true);
            setQueryText('');
            setStepIdx((prev) => (prev + 1) % MOCK_STEPS.length);
          }, 7000);
        }, 1500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [stepIdx, isTyping]);

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 relative z-20">
      
      {/* Sidebar: File Source list */}
      <div className="order-2 lg:order-1 lg:col-span-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-bold text-slate-200 tracking-wide">Workspace Docs</span>
          </div>
          <span className="text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-semibold border border-sky-500/20">
            {MOCK_DOCS.length} files
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 flex-1">
          {MOCK_DOCS.map((doc, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                doc.status === 'indexing' 
                  ? 'bg-amber-500/5 border-amber-500/20' 
                  : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {doc.type === 'pdf' ? (
                  <FileText className={`w-8 h-8 p-1.5 rounded-lg shrink-0 ${doc.status === 'indexing' ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-rose-500/10 text-rose-400'}`} />
                ) : (
                  <FileCode className={`w-8 h-8 p-1.5 rounded-lg shrink-0 ${doc.status === 'indexing' ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-sky-500/10 text-sky-400'}`} />
                )}
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-200 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{doc.size}</p>
                </div>
              </div>

              <div>
                {doc.status === 'indexing' ? (
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-semibold bg-amber-400/5 px-2 py-1 rounded-md border border-amber-500/20">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                    Syncing
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">
                    <Check className="w-3 h-3" />
                    Indexed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Small hint block */}
        <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 text-[11px] text-slate-400 font-light leading-relaxed">
          <span className="text-sky-400 font-semibold">Real-time sync:</span> Any changes to Markdown files or newly dropped PDFs are parsed & re-indexed within seconds.
        </div>
      </div>

      {/* Main Console: Query Interface */}
      <div className="order-1 lg:order-2 lg:col-span-8 bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col shadow-2xl overflow-hidden min-h-[350px]">
        {/* Console Header */}
        <div className="bg-slate-950/40 border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 ml-2">Console Interface</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>EchoDocs Engine</span>
          </div>
        </div>

        {/* Console Body */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          {/* Query Bar */}
          <div className="flex items-center gap-3 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="text-sm font-medium text-slate-200 flex-1 min-h-[20px] font-mono">
              {queryText}
              {isTyping && <span className="w-1.5 h-4 bg-sky-400 inline-block animate-pulse ml-0.5" />}
            </div>
            {!isTyping && !isProcessing && !showResult && (
              <span className="text-[10px] text-slate-500 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">Enter</span>
            )}
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <div className="w-10 h-10 border-2 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
                <Sparkles className="w-4 h-4 text-purple-400 absolute top-3 left-3 animate-pulse" />
              </div>
              <p className="text-xs font-mono text-slate-400 animate-pulse">
                Querying database & parsing embeddings...
              </p>
            </div>
          )}

          {/* Results Output */}
          {showResult && (
            <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Answer Box */}
              <div className="bg-gradient-to-tr from-purple-500/5 to-sky-500/5 border border-sky-500/10 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-sky-400 tracking-wider uppercase">Grounded Answer</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-light text-left">
                  {/* Custom rendering to highlight citations */}
                  {currentStep.answer.split(/(\[\d+\])/).map((segment, idx) => {
                    const match = segment.match(/\[(\d+)\]/);
                    if (match) {
                      const num = parseInt(match[1]);
                      return (
                        <span 
                          key={idx}
                          onMouseEnter={() => setHoveredCitation(num)}
                          onMouseLeave={() => setHoveredCitation(null)}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mx-1 transition-all cursor-pointer ${
                            hoveredCitation === num 
                              ? 'bg-sky-400 text-slate-950 scale-110 shadow-lg shadow-sky-400/20' 
                              : 'bg-white/10 text-sky-300 hover:bg-white/20'
                          }`}
                        >
                          {num}
                        </span>
                      );
                    }
                    return segment;
                  })}
                </p>
              </div>

              {/* Citations Tooltip / Reference Box */}
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
                  Source Citations
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {currentStep.citations.map((cite) => (
                    <div 
                      key={cite.id}
                      className={`p-3 rounded-lg border transition-all duration-300 ${
                        hoveredCitation === cite.id
                          ? 'bg-sky-500/10 border-sky-400/40 shadow-[0_4px_12px_rgba(56,189,248,0.15)] scale-[1.02]'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          hoveredCitation === cite.id ? 'bg-sky-400 text-slate-950' : 'bg-white/5 text-slate-400'
                        }`}>
                          {cite.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">{cite.file}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2 italic font-light">
                        "{cite.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {!isTyping && !isProcessing && !showResult && (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
              Ready to execute search query...
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="bg-slate-950/20 border-t border-white/5 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-mono text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Response verified by document embeddings</span>
          </div>
          <span>100% Hallucination Free</span>
        </div>
      </div>
      
    </div>
  );
}
