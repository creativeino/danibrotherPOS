'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('danish');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Login failed');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Connection failed. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 flex flex-col justify-center items-center p-3.5 sm:p-6 relative overflow-hidden">
      {/* Decorative ambient background blur */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 p-5 sm:p-8 md:p-10 text-slate-900 relative z-10">
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-xs border border-slate-100 mb-3 sm:mb-4">
            <img
              src="/logodanibro.svg"
              alt="Danibrothers"
              className="h-9 sm:h-12 w-auto max-w-[200px] sm:max-w-[220px] object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Retail POS & Inventory</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Computer, Laptop & CCTV Management</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-xl text-xs text-center font-medium shadow-2xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-300/80 focus:border-blue-600 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-300/80 focus:border-blue-600 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In to Terminal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2.5">
          <p className="font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Authorized Terminal Credentials:
          </p>
          <button
            type="button"
            onClick={() => { setUsername('danish'); setPassword('admin123'); }}
            className="w-full p-3 bg-slate-50/80 hover:bg-blue-50/50 hover:border-blue-200 rounded-xl border border-slate-200/80 text-left transition cursor-pointer flex items-center justify-between group"
          >
            <div>
              <span className="text-slate-900 block font-bold group-hover:text-blue-700">Danish Saeed (Admin)</span>
              <span className="text-slate-500 font-mono text-[11px]">User: danish • Pass: admin123</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-white border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600 px-2 py-1 rounded-md text-slate-500 shadow-2xs">
              Autofill
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
