'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  LayoutDashboard,
  Boxes,
  PlusCircle,
  Truck,
  FileText,
  Users,
  Wallet,
  Building2,
  RotateCcw,
  Receipt,
  BarChart3,
  Barcode,
  Settings,
  LogOut,
  Laptop,
} from 'lucide-react';
import { UserSession } from '@/types/pos';

interface SidebarProps {
  currentUser: UserSession | null;
}

export function Sidebar({ currentUser }: SidebarProps) {
  const pathname = usePathname();

  const groups = [
    {
      title: 'Counter & Sales',
      items: [
        { label: 'POS Terminal', href: '/pos', icon: ShoppingCart, highlight: true },
        { label: 'Sales Invoices', href: '/invoices', icon: FileText },
        { label: 'Sales Returns (RMA)', href: '/sales-returns', icon: RotateCcw },
      ],
    },
    {
      title: 'Catalog & Stock',
      items: [
        { label: 'Products Catalog', href: '/products', icon: Boxes },
        { label: '+ Add New Product', href: '/products/new', icon: PlusCircle },
        { label: 'Barcode & QR Labels', href: '/barcodes', icon: Barcode },
      ],
    },
    {
      title: 'Accounts & Ledgers',
      items: [
        { label: 'Purchase Returns (Vendor)', href: '/purchase-returns', icon: RotateCcw },
        { label: 'Suppliers & Vendors', href: '/suppliers', icon: Building2 },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Financial Reports', href: '/reports', icon: BarChart3 },
        { label: 'Shop Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col shrink-0 min-h-screen text-slate-700 select-none shadow-[2px_0_12px_rgba(0,0,0,0.03)] z-20">
      {/* Brand Header with Official Logo */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white via-white to-slate-50/40">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
          <img
            src="/logodanibro.svg"
            alt="Danibrothers"
            className="h-9 w-auto max-w-[170px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-102"
          />
        </Link>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
          v2.0
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3.5 py-4 space-y-5 overflow-y-auto">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/90 mb-1.5">
              {group.title}
            </p>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && item.href !== '/products' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : item.highlight
                      ? 'text-blue-700 bg-blue-50/80 hover:bg-blue-100/90 font-bold border border-blue-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                      isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Quick Help Card */}
      <div className="px-3.5 py-3 mx-3 mb-2 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80 text-[11px] shadow-2xs">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Store Terminal Support</p>
        <p className="font-semibold text-slate-700 truncate mt-0.5">danibrothers99@gmail.com</p>
      </div>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate mr-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {currentUser?.fullName?.charAt(0) || 'D'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {currentUser?.fullName || 'Cashier Desk'}
              </p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                {currentUser?.role || 'CASHIER'}
              </p>
            </div>
          </div>
          <Link
            href="/api/auth/logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
