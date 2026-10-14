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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Sales</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(metrics.todaySales)}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Total invoiced today</p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Profit (COGS)</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600 font-mono">{formatCurrency(metrics.grossProfit)}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Net revenue minus cost</p>
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supplier Payables</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-purple-700 font-mono">{formatCurrency(metrics.totalSupplierPayables)}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Pending distributor bills</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Inventory Valuation</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">{formatCurrency(metrics.totalInventoryValue)}</p>
          <p className="text-xs text-slate-400 mt-1">Total stock on hand at cost price</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Stock Reorder Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-xl font-black text-amber-600">{metrics.lowStockCount}</span>
              <span className="text-xs text-slate-500 font-medium ml-1">Low Stock</span>
            </div>
            <div>
              <span className="text-xl font-black text-rose-600">{metrics.outOfStockCount}</span>
              <span className="text-xs text-slate-500 font-medium ml-1">Out of Stock</span>
            </div>
          </div>
          <Link href="/products?lowStock=true" className="text-xs font-bold text-blue-600 hover:underline mt-2 inline-block">
            View reorder items &rarr;
          </Link>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-900">Recent Sales Invoices</h2>
            <Link href="/invoices" className="text-xs font-bold text-blue-600 hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Invoice #</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metrics.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No invoices recorded yet. Start selling from POS!
                    </td>
                  </tr>
                ) : (
                  metrics.recentSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-mono text-blue-600 font-bold">{sale.invoiceNumber}</td>
                      <td className="p-2.5 font-medium truncate max-w-[150px]">{sale.customerName}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 font-mono">{formatCurrency(sale.grandTotal)}</td>
                      <td className="p-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sale.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
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
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-900">Top-Selling Products</h2>
            <span className="text-xs text-slate-400">By quantity</span>
          </div>
          <div className="space-y-2.5">
            {metrics.topSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center font-medium">No sales recorded yet.</p>
            ) : (
              metrics.topSellingProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{p.qty} units sold</p>
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
