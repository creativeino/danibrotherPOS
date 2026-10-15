'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { UserSession } from '@/types/pos';
import { Menu } from 'lucide-react';

interface DashboardShellProps {
  user: UserSession;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 text-slate-900 font-sans">
      <Sidebar
        currentUser={user}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <img
              src="/logodanibro.svg"
              alt="Danibrothers"
              className="h-6 sm:h-7 w-auto object-contain hidden xs:block"
            />
            <span className="text-slate-300 hidden md:inline">|</span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase truncate">
                Retail POS & Inventory
              </span>
            </div>
            <span className="text-slate-200 hidden xl:inline">|</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200/60 hidden sm:flex items-center gap-1.5 shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user.fullName}</p>
              <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                {user.role}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs border-2 border-white ring-1 ring-slate-200">
              {user.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/40 p-3 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
