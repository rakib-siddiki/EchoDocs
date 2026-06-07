'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';


export default function SignUpPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-sans text-slate-100 p-8 relative overflow-hidden">
      {/* Decorative blurred glow objects */}
      <div className="absolute top-[15%] left-[25%] w-72 h-72 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[25%] w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-8 text-center z-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-sky-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2 tracking-tight">
          EchoDocs
        </h1>
        <p className="text-slate-400 text-sm font-light">
          AI-Powered RAG Knowledge Engine
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl z-10">
        <h2 className="text-2xl font-bold text-center text-slate-100 mb-6">
          Create Account
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>



          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_15px_-3px_rgba(168,85,247,0.4)] hover:shadow-[0_8px_20px_-3px_rgba(168,85,247,0.5)] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
