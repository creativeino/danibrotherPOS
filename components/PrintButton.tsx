'use client';

import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function PrintButton({
  label = 'Print Now',
  className = 'px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-sans font-medium flex items-center gap-1.5 shadow transition',
  iconClassName = 'w-3.5 h-3.5',
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      <Printer className={iconClassName} /> {label}
    </button>
  );
}
