'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export function DashboardHeader() {
  return (
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
  );
}
