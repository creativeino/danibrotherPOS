'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/calculations';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  Building,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  Printer,
  Loader2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface Props {
  initialValuation: any[];
}

export function FinancialReportsDashboard({ initialValuation }: Props) {
  const [period, setPeriod] = useState<
    'daily' | 'yesterday' | 'weekly' | 'lastWeek' | 'monthly' | 'lastMonth' | 'yearly' | 'lastYear' | 'custom'
  >('daily');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchReport = async (
    targetPeriod = period,
    targetFrom = fromDate,
    targetTo = toDate
  ) => {
    setLoading(true);
    try {
      let url = `/api/reports/financial?period=${targetPeriod}`;
      if (targetPeriod === 'custom') {
        url += `&from=${targetFrom}&to=${targetTo}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load financial report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period, fromDate, toDate);
  }, [period]);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    setPeriod('custom');
    fetchReport('custom', fromDate, toDate);
  };

  const summary = reportData?.summary || {
    totalGrossSales: 0,
    totalSalesReturns: 0,
    netRevenue: 0,
    totalCogs: 0,
    grossProfit: 0,
    grossProfitMargin: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalPurchases: 0,
    totalPurchaseReturns: 0,
    invoicesCount: 0,
  };

  const periodLabels: Record<string, string> = {
    daily: "Today's Performance (Daily)",
    yesterday: "Yesterday's Performance (Previous Day)",
    weekly: 'Last 7 Days (Weekly)',
    lastWeek: 'Previous Week Performance',
    monthly: 'This Month (Current)',
    lastMonth: 'Last Month (Previous Month)',
    yearly: 'This Year (Year to Date)',
    lastYear: 'Previous Year (Full Year)',
    custom: `Custom Selected Dates (${fromDate} to ${toDate})`,
  };

  return (
    <div className="space-y-6">
      {/* Report Filter & Controls Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                period === 'daily'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                period === 'yesterday'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday (Previous Day)
            </button>
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                period === 'weekly'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                period === 'monthly'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod('lastMonth')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                period === 'lastMonth'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                period === 'yearly'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Custom Date Range Picker */}
          <form
            onSubmit={handleApplyCustomDates}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs"
          >
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-slate-400 font-semibold">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-transparent font-mono text-slate-800 focus:outline-none cursor-pointer"
                required
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-slate-400 font-semibold">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-transparent font-mono text-slate-800 focus:outline-none cursor-pointer"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
              Fetch Dates
            </button>
          </form>
        </div>

        {/* Current Period Info Header */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-bold text-slate-900">{periodLabels[period]}</span>
          </div>
          {reportData && (
            <span className="text-slate-400 font-mono text-[11px]">
              {new Date(reportData.startDate).toLocaleDateString('en-PK')} &rarr;{' '}
              {new Date(reportData.endDate).toLocaleDateString('en-PK')}
            </span>
          )}
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Sales Revenue</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(summary.netRevenue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Gross: {formatCurrency(summary.totalGrossSales)} ({summary.invoicesCount} Invoices)
            </p>
          </div>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost of Goods (COGS)</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-700 font-mono tracking-tight">
              {formatCurrency(summary.totalCogs)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Inventory acquisition cost
            </p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Profit</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
              {formatCurrency(summary.grossProfit)}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              Margin: {summary.grossProfitMargin}% of revenue
            </p>
          </div>
        </div>

        {/* Net Profit (After Expenses) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Profit</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-indigo-600 font-mono tracking-tight">
              {formatCurrency(summary.netProfit)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              After {formatCurrency(summary.totalExpenses)} shop expenses
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Returns & Refunds */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Returns (RMA)</span>
            <RotateCcw className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 font-mono mt-2">
            {formatCurrency(summary.totalSalesReturns)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.salesReturnsCount || 0} returned sales recorded
          </p>
        </div>

        {/* Purchases From Suppliers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supplier Purchases</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-700 font-mono mt-2">
            {formatCurrency(summary.totalPurchases)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Vendor bills in this period
          </p>
        </div>

        {/* Operating Shop Expenses */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Shop Expenses</span>
            <Receipt className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-2">
            {formatCurrency(summary.totalExpenses)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.expensesCount || 0} bills & maintenance expenses
          </p>
        </div>
      </div>

      {/* Invoiced Sales in this period */}
      {reportData?.recentSales && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Period Sales Invoices</h2>
              <p className="text-[11px] text-slate-500">Invoices billed during this selected period</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              {reportData.recentSales.length} Invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Received</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  reportData.recentSales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2 px-3 font-mono text-blue-600 font-bold">{s.invoiceNumber}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(s.invoiceDate).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{s.customerName}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(s.grandTotal)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(s.paymentReceived)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Inventory Valuation & Margin Analysis */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Live Inventory Valuation & Profitability</h2>
            <p className="text-[11px] text-slate-500">Current stock on hand valuation and anticipated retail margins</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {initialValuation.length} active products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3 text-center">Stock</th>
                <th className="py-2.5 px-3 text-right">Unit Cost</th>
                <th className="py-2.5 px-3 text-right">Retail Price</th>
                <th className="py-2.5 px-3 text-right">Total Cost Value</th>
                <th className="py-2.5 px-3 text-right">Total Retail Value</th>
                <th className="py-2.5 px-3 text-right">Expected Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {initialValuation.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No physical inventory items found.
                  </td>
                </tr>
              ) : (
                initialValuation.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-2 px-3 font-mono text-blue-600 font-bold">{item.sku}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[200px]">{item.name}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">{formatCurrency(item.unitCost)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">{formatCurrency(item.costValue)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.retailValue)}</td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-600">{formatCurrency(item.potentialProfit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
