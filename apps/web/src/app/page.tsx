import { cookies } from 'next/headers';
import Link from 'next/link';
import { Navbar } from '@/components/layouts/Navbar';
import InteractiveDemo from '@/components/landing/InteractiveDemo';
import {
  Sparkles,
  FileText,
  Cpu,
  Database,
  ShieldCheck,
  ArrowRight,
  Network,
} from 'lucide-react';

export default async function Index() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const isAuthenticated = Boolean(token);

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
      {/* Dynamic Animated Glow Objects */}
      <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] bg-purple-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div
        className="absolute top-[20%] right-[5%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-[20%] left-[5%] w-[350px] h-[350px] bg-pink-500/8 rounded-full blur-[90px] pointer-events-none animate-pulse-glow"
        style={{ animationDelay: '4s' }}
      />

      {/* Sticky Premium Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-12 px-4 sm:pt-20 sm:pb-16 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-full px-4 py-1.5 mb-6 sm:mb-8 backdrop-blur-md shadow-md animate-fade-in hover:border-white/20 transition-all duration-300">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-slate-300">
            INTRODUCING ECHODOCS ENGINE
          </span>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" />
        </div>

        {/* Master Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black leading-[1.15] sm:leading-[1.1] tracking-tight max-w-4xl mb-6 sm:mb-8 bg-linear-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Search & Query Your Documentation in
          <span className="block bg-linear-to-r from-sky-400 via-purple-400 to-pink-500 bg-clip-text text-transparent mt-2 py-1">
            Real-Time Grounded AI
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-sm sm:text-base md:text-xl text-slate-400 font-light leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
          EchoDocs turns your PDFs and Markdown files into interactive knowledge
          bases. Get instant, context-verified answers from your codebase or
          internal wiki with{' '}
          <span className="text-sky-400 font-medium">zero hallucinations</span>{' '}
          and inline source citations.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xs sm:max-w-none px-4 sm:px-0 mb-12 sm:mb-20">
          <Link
            href={isAuthenticated ? '/dashboard' : '/sign-in'}
            className="group flex items-center justify-center gap-2 bg-linear-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-bold text-base shadow-[0_8px_25px_-5px_rgba(56,189,248,0.3)] hover:shadow-[0_10px_30px_-5px_rgba(168,85,247,0.4)] transition-all duration-300 cursor-pointer border-none scale-100 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/rakib-siddiki/EchoDocs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] text-slate-200 hover:text-white px-8 py-4 rounded-xl font-bold text-base border border-white/5 hover:border-white/15 backdrop-blur-md transition-all duration-300 cursor-pointer w-full sm:w-auto text-center"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <span>Star on GitHub</span>
          </a>
        </div>

        {/* Floating Document Concept (visual decorator) */}
        <div className="absolute top-[20%] left-[-10%] hidden xl:flex flex-col gap-4 animate-float">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl p-3.5 flex items-center gap-3 shadow-lg shadow-black/40 max-w-[200px]">
            <FileText className="w-6 h-6 text-rose-500 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200 truncate">
                api-routes.pdf
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold">
                Ready to Query
              </p>
            </div>
          </div>
        </div>

        <div className="absolute top-[40%] right-[-10%] hidden xl:flex flex-col gap-4 animate-float-delayed">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl p-3.5 flex items-center gap-3 shadow-lg shadow-black/40 max-w-[200px]">
            <FileText className="w-6 h-6 text-sky-400 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200 truncate">
                architecture.md
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold">
                Grounded (32 chunks)
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Simulated Workspace Component */}
        <div className="w-full relative py-6">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-purple-500/5 to-transparent blur-xl pointer-events-none rounded-3xl" />
          <InteractiveDemo />
        </div>
      </section>

      {/* Bento Grid Product Features Section */}
      <section className="relative z-10 py-24 px-6 md:px-12 bg-slate-950/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-sky-400 uppercase mb-3">
              PRODUCT CAPABILITIES
            </h2>
            <p className="text-3xl md:text-4xl font-black text-slate-100">
              Engineered for absolute accuracy and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.03] backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">
                100% Grounded Responses
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Our advanced RAG engine checks every single word against
                uploaded documents, eliminating hallucinations. If it isn't in
                your document, EchoDocs won't invent it.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.03] backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">
                Multi-Format File Support
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Drop in raw PDFs, Markdown specifications, API reference
                manuals, or configuration schemas. EchoDocs parses, chunks, and
                structures them into optimized embeddings automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.03] backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">
                Blazing Fast Vector Indexing
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Powered by a high-throughput processing pipeline and fast vector
                lookups, indexing finishes in seconds so you can search updated
                documents immediately.
              </p>
            </div>

            {/* Feature 4: Large Banner Card */}
            <div className="md:col-span-2 bg-gradient-to-tr from-sky-500/5 to-purple-500/5 border border-sky-500/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase mb-3">
                  Developer First
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">
                  Built for high-velocity teams
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  EchoDocs integrates seamlessly into your documentation
                  pipelines, offering clean API interfaces, background worker
                  status tracking, and absolute transparency with deep context
                  references.
                </p>
              </div>
              <Link
                href={isAuthenticated ? '/dashboard' : '/sign-in'}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 text-center"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.03] backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Network className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">
                Traceable Citations
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Hover over answer citations to preview raw source snippets, page
                numbers, and filenames. Full transparency ensures your team
                always knows exactly where answers come from.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Integration Showcase */}
      <section className="relative z-10 py-20 px-6 md:px-12 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center max-w-lg mb-10">
            <h2 className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-2">
              POWERING ECHODOCS
            </h2>
            <p className="text-2xl font-black text-slate-200">
              Robust Enterprise Stack
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 max-w-3xl">
            {[
              { name: 'Next.js 16', desc: 'React Server Actions & Routing' },
              { name: 'NestJS v11', desc: 'Enterprise Core API' },
              { name: 'Prisma ORM', desc: 'Structured Data Storage' },
              { name: 'PostgreSQL', desc: 'Robust Relational DB' },
              { name: 'BullMQ', desc: 'Background Indexing Queue' },
              { name: 'Redis', desc: 'Job Scheduling & Caching' },
              { name: 'Tailwind CSS v4', desc: 'Modern High-Perf Styles' },
            ].map((tech, idx) => (
              <div
                key={idx}
                className="bg-white/[0.02] border border-white/5 px-4.5 py-2.5 rounded-xl flex flex-col items-center gap-0.5 hover:border-white/10 transition-all duration-300"
              >
                <span className="text-xs font-bold text-slate-200">
                  {tech.name}
                </span>
                <span className="text-[9px] text-slate-500 font-medium">
                  {tech.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action / Footer Section */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950/80 pt-16 pb-10 md:pt-20 md:pb-12 px-4 sm:px-6 md:px-12 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-10 md:gap-12 text-center">
          <div className="max-w-xl w-full px-4 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-4">
              Unlock the secrets within your docs.
            </h2>
            <p className="text-sm text-slate-400 mb-6 sm:mb-8 font-light">
              Stop digging through multi-page PDFs or endless documentation
              folders. EchoDocs gives you instant, verified answers with full
              tracing.
            </p>
            <Link
              href={isAuthenticated ? '/dashboard' : '/sign-in'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-linear-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-sky-500/10 hover:scale-[1.02] transition-all duration-300 text-center"
            >
              <span>Initialize Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="w-full flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-8 gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-linear-to-tr from-sky-400 to-purple-500 flex items-center justify-center font-bold text-white text-[10px]">
                E
              </div>
              <span className="font-bold text-slate-400">
                EchoDocs Engine v1.0
              </span>
            </div>
            <p className="font-light">
              © {new Date().getFullYear()} EchoDocs Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/rakib-siddiki/EchoDocs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-colors"
              >
                GitHub Codebase
              </a>
              <span className="text-white/5">|</span>
              <a href="#" className="hover:text-slate-300 transition-colors">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
