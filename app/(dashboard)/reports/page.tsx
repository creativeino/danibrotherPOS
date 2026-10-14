import React from 'react';
import { ReportService } from '@/services/report-service';
import { formatCurrency } from '@/lib/calculations';
import { BarChart3, TrendingUp, Package, DollarSign, Download } from 'lucide-react';

export default async function ReportsPage() {
  const valuation = ReportService.getInventoryValuation();
  const metrics = ReportService.getDashboardMetrics();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial & Inventory Reports</h1>
          <p className="text-xs text-slate-500 font-medium">
            Audit-ready gross profit statements, cost valuation, and stock profitability
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Total Invoiced Revenue</span>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{formatCurrency(metrics.totalSales)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Recorded Cost of Goods Sold (COGS)</span>
          <p className="text-2xl font-black text-slate-700 mt-2 font-mono">{formatCurrency(metrics.totalCogs)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs uppercase text-emerald-700 font-bold tracking-wider">Gross Profit (Real COGS)</span>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">{formatCurrency(metrics.grossProfit)}</p>
        </div>
      </div>

      {/* Inventory Valuation & Potential Profit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-sm text-slate-900">Live Inventory Valuation by Product</h2>
          <span className="text-xs text-slate-500 font-medium">Cost value vs Expected retail margin</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5 text-center">On Hand</th>
                <th className="p-3.5 text-right">Unit Cost</th>
                <th className="p-3.5 text-right">Selling Price</th>
                <th className="p-3.5 text-right">Total Cost Value</th>
                <th className="p-3.5 text-right">Total Retail Value</th>
                <th className="p-3.5 text-right">Expected Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {valuation.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-mono text-blue-600 font-bold">{v.sku}</td>
                  <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate">{v.name}</td>
                  <td className="p-3.5 text-center font-bold font-mono text-slate-900">{v.quantity}</td>
                  <td className="p-3.5 text-right font-mono text-slate-500">{formatCurrency(v.unitCost)}</td>
                  <td className="p-3.5 text-right font-mono text-slate-700">{formatCurrency(v.unitPrice)}</td>
                  <td className="p-3.5 text-right font-mono font-semibold text-slate-900">{formatCurrency(v.costValue)}</td>
                  <td className="p-3.5 text-right font-mono font-semibold text-slate-900">{formatCurrency(v.retailValue)}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(v.potentialProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
