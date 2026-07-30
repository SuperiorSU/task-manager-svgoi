'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Floating selection bar (slides up from the bottom, iOS-style) shared by any
 * table with row selection. Callers supply the action buttons as children.
 */
export const BulkBar = ({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      'fixed bottom-6 left-1/2 z-30 -translate-x-1/2 transition-all duration-200',
      count > 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
    )}
  >
    <div className="flex items-center gap-3 rounded-lg bg-slate-900 px-5 py-3 shadow-xl">
      <span className="text-sm font-medium text-white">{count} selected</span>
      <div className="h-4 w-px bg-white/20" />
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        className="ml-1 rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);
