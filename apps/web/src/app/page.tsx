import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function Index() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const isAuthenticated = Boolean(token);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 px-4 py-8 font-sans overflow-hidden">
      {/* Decorative blurred glow objects */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-purple-500/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] bg-sky-500/12 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl text-center z-10">
        <div className="inline-flex items-center gap-2 bg-white/3 border border-white/8 rounded-full px-5 py-2 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
          <span className="text-xs font-medium text-slate-400 tracking-wider">
            V1.0 INITIALIZED
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tight mb-6 bg-linear-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Search & Query Your Documentation in
          <span className="block bg-linear-to-r from-sky-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mt-1">
            Real-Time Grounded AI
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-xl mx-auto mb-12">
          EchoDocs turns your PDFs and Markdown files into interactive knowledge
          bases. Get instant, cited answers from your codebase or internal wiki
          without hallucinations.
        </p>

        <div className="flex gap-4 justify-center items-center">
          <Link
            href={isAuthenticated ? '/dashboard' : '/sign-in'}
            className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4)] transition-all cursor-pointer border-none"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/rakib-siddiki/EchoDocs"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/3 hover:bg-white/5 text-slate-100 px-10 py-4 rounded-xl font-semibold text-lg border border-white/10 backdrop-blur-sm transition-all cursor-pointer"
          >
            View GitHub
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-sm font-light z-10">
        EchoDocs Knowledge Engine © 2026
      </div>
    </div>
  );
}
