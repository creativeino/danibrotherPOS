'use client';

import { useEffect, useState } from 'react';
import { Printer, Check, X } from 'lucide-react';

interface AutoPrintProps {
  autoTrigger?: boolean;
}

export function AutoPrint({ autoTrigger = true }: AutoPrintProps) {
  const [hasPrinted, setHasPrinted] = useState(false);

  useEffect(() => {
    if (!autoTrigger) return;

    // Small delay to ensure all DOM elements, SVGs, and fonts have fully rendered
    const timer = setTimeout(() => {
      try {
        window.print();
        setHasPrinted(true);
      } catch (err) {
        console.warn('Auto print was blocked or failed:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [autoTrigger]);

  return null;
}
