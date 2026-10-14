import React from 'react';
import { dbStore } from '@/lib/db';
import { SettingsForm } from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = dbStore.getState().settings;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shop Configuration & Preferences</h1>
        <p className="text-xs text-slate-500 font-medium">
          Configure business details, invoice sequence numbering, currency (PKR), and warranty policies
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
