import React from 'react';
import { ReportService } from '@/services/report-service';
import { FinancialReportsDashboard } from '@/components/FinancialReportsDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReportsPage() {
  const valuation = await ReportService.getInventoryValuation();

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Financial & Performance Reports</h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Daily, Weekly, Monthly, Yearly and Custom Date Range P&L, COGS, Net Profit, and Inventory Valuation
          </p>
        </div>
      </div>

      <FinancialReportsDashboard initialValuation={valuation} />
    </div>
  );
}

