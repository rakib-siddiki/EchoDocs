'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full flex justify-center sticky top-0 z-50 px-4 py-4 pointer-events-none select-none">
      <header
        className={`pointer-events-auto flex items-center justify-between w-full max-w-5xl rounded-2xl border transition-all duration-300 ease-in-out ${
          scrolled
            ? 'bg-slate-950/75 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-2.5 px-6 backdrop-blur-xl scale-[0.98]'
            : 'bg-slate-950/30 border-white/5 shadow-md py-3.5 px-8 backdrop-blur-lg scale-100'
        }`}
      >
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-sky-400 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/10 group-hover:scale-105 transition-transform duration-200">
              E
            </div>
            <span className="text-xl font-black bg-linear-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent group-hover:text-white transition-colors">
              EchoDocs
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1.5 bg-slate-900/50 border border-white/5 rounded-xl p-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-sky-500/15 to-purple-500/15 text-sky-400 border border-sky-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/chat"
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                isActive('/chat')
                  ? 'bg-gradient-to-r from-sky-500/15 to-purple-500/15 text-sky-400 border border-sky-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Chat
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile Navigation Links */}
          <div className="flex sm:hidden items-center gap-4 border-r border-white/10 pr-4 mr-1">
            <Link
              href="/dashboard"
              className={`text-xs font-semibold ${
                isActive('/dashboard') ? 'text-sky-400' : 'text-slate-400'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/chat"
              className={`text-xs font-semibold ${
                isActive('/chat') ? 'text-sky-400' : 'text-slate-400'
              }`}
            >
              Chat
            </Link>
          </div>

          {/* Custom Profile & Logout */}
          {user ? (
            <div className="flex items-center gap-3 bg-slate-900/40 border border-white/10 rounded-xl px-4 py-1.5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-200 max-w-[140px] truncate">{user.email}</span>
              </div>
              <button
                onClick={() => logout()}
                className="text-[10px] bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-300 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-red-500/20 transition-all cursor-pointer font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="text-xs font-bold bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 px-4 py-2 rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>
    </div>
  );
}
