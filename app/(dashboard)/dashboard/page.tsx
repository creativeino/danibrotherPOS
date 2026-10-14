import React from 'react';
import { ReportService } from '@/services/report-service';
import { formatCurrency } from '@/lib/calculations';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  Building,
  CreditCard,
  ShoppingCart,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const metrics = await ReportService.getDashboardMetrics();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">
            Daily retail transactions, inventory valuations, and accounts summary
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <ShoppingCart className="w-4 h-4" /> Open POS Terminal
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Today's Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Sales</span>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">{formatCurrency(metrics.todaySales)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Total invoiced today</span>
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Profit (COGS)</span>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-emerald-600 font-mono tracking-tight">{formatCurrency(metrics.grossProfit)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Net revenue minus inventory cost</span>
            </div>
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supplier Payables</span>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-purple-700 font-mono tracking-tight">{formatCurrency(metrics.totalSupplierPayables)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Pending distributor bills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Valuation</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3 font-mono">{formatCurrency(metrics.totalInventoryValue)}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Total stock on hand at cost price</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock Reorder Alerts</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-600 font-mono">{metrics.lowStockCount}</span>
              <span className="text-xs text-slate-500 font-semibold">Low Stock</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600 font-mono">{metrics.outOfStockCount}</span>
              <span className="text-xs text-slate-500 font-semibold">Out of Stock</span>
            </div>
          </div>
          <Link href="/products?lowStock=true" className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2.5 inline-flex items-center gap-1">
            View reorder items <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">Recent Sales Invoices</h2>
            <Link href="/invoices" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-200/70 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metrics.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No invoices recorded yet. Start selling from POS!
                    </td>
                  </tr>
                ) : (
                  metrics.recentSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-blue-600 font-bold">{sale.invoiceNumber}</td>
                      <td className="py-3 px-3 font-medium truncate max-w-[150px]">{sale.customerName}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">{formatCurrency(sale.grandTotal)}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">Top-Selling Products</h2>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">By quantity</span>
          </div>
          <div className="space-y-3">
            {metrics.topSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">No sales recorded yet.</p>
            ) : (
              metrics.topSellingProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-colors group">
                  <div className="flex items-center gap-3 truncate mr-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100/70 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{p.qty} units sold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-emerald-700 font-mono">{formatCurrency(p.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
