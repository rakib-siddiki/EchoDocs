import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function DashboardPage() {
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
          <Link href="/chat" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Chat
          </Link>
          <UserButton showName />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold mb-4">
          Welcome to your Dashboard
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-lg">
          This is where you will manage and upload your documentation files. 
          Use the User menu in the top right to configure your profile or sign out.
        </p>
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full text-left">
          <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
            <li>Upload documents to seed your vector database</li>
            <li>Connect your GitHub repository for automated sync</li>
            <li>Navigate to the chat to query grounded responses</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
