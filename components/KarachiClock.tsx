'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatDateTimePK } from '@/lib/calculations';

export function KarachiClock() {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      setTimeStr(formatDateTimePK(new Date()));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeStr) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-lg text-[11px] font-mono text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span>--/--/---- --:-- --</span>
      </div>
    );
  }

  return (
    <div
      title="Karachi, Pakistan Time (PKT / UTC+5)"
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/70 rounded-lg text-[11px] font-mono font-medium text-slate-700 shadow-2xs transition select-none"
    >
      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      <span>{timeStr}</span>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-0.5">PKT</span>
    </div>
  );
}
