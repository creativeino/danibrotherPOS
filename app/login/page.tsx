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
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 text-slate-900">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logodanibro.svg"
            alt="Danibrothers"
            className="h-16 w-auto max-w-[260px] object-contain mb-3 drop-shadow-2xs"
          />
          <h1 className="text-xl font-black tracking-tight text-slate-900">Retail POS & Inventory</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Computer, Laptop & CCTV Management</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Terminal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p className="font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Authorized Terminal User:
          </p>
          <button
            type="button"
            onClick={() => { setUsername('danish'); setPassword('admin123'); }}
            className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-slate-900 block font-bold">Danish Saeed</span>
              <span className="text-slate-500 font-mono text-[11px]">Username: danish</span>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg border border-blue-100">
              Quick Fill
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
