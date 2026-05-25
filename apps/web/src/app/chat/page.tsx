import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900/50 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
            EchoDocs
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Dashboard
          </Link>
          <UserButton showName />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold mb-4">
          Welcome to the Chat Interface
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-lg">
          Here you will be able to query your RAG knowledge engine and get cited answers.
          You can use the User menu in the top right to sign out.
        </p>
      </main>
    </div>
  );
}
