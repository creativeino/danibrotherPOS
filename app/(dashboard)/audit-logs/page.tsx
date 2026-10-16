import React from 'react';
import { prisma } from '@/lib/prisma';
import { formatDateTimePK } from '@/lib/calculations';
import { ShieldCheck, History } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Audit Trails</h1>
          <p className="text-xs text-slate-500 font-medium">
            Immutable log of system modifications, price adjustments, and administrative operations
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Record ID</th>
                <th className="p-3.5">Audit Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-slate-500">
                      {formatDateTimePK(l.createdAt)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {l.user?.fullName || 'System'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{l.entityType}</td>
                    <td className="p-3.5 font-mono text-slate-500">{l.entityId || '—'}</td>
                    <td className="p-3.5 font-mono text-slate-500 max-w-md truncate" title={l.details || ''}>
                      {l.details || '—'}
                    </td>
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
