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
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen text-slate-700 select-none shadow-xs">
      {/* Brand Header with Official Logo */}
      <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <img
            src="/logodanibro.svg"
            alt="Danibrothers"
            className="h-9 w-auto max-w-[170px] object-contain shrink-0"
          />
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : item.highlight
                      ? 'text-blue-700 bg-blue-50/70 hover:bg-blue-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Support Info */}
      <div className="px-3.5 py-2.5 mx-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Help & Support</p>
        <p className="font-semibold text-slate-700 truncate mt-0.5">danibrothers99@gmail.com</p>
      </div>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-bold text-slate-900 truncate">
              {currentUser?.fullName || 'Cashier Desk'}
            </p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
              {currentUser?.role || 'CASHIER'}
            </p>
          </div>
          <Link
            href="/api/auth/logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
