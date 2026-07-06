'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBulkUpdateStatus } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@godigitify/types';

type Props = {
  selectedIds: string[];
  onClear: () => void;
};

export const BulkActionBar = ({ selectedIds, onClear }: Props) => {
  const { mutate: bulkUpdate, isPending } = useBulkUpdateStatus();
  // Tracked separately from `isPending` so clicking Accept doesn't also
  // spinner/disable the unrelated Cancel button (both share one mutation).
  const [pendingAction, setPendingAction] = useState<TaskStatus | null>(null);

  const handleBulk = (status: TaskStatus) => {
    setPendingAction(status);
    bulkUpdate(
      { taskIds: selectedIds, status },
      { onSuccess: onClear, onSettled: () => setPendingAction(null) }
    );
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 z-30 -translate-x-1/2 transition-all duration-200',
        selectedIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 shadow-xl">
        <span className="text-sm font-medium text-white">
          {selectedIds.length} selected
        </span>
        <div className="h-4 w-px bg-white/20" />
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => handleBulk('ACCEPTED')}
          disabled={isPending}
          loading={pendingAction === 'ACCEPTED'}
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => handleBulk('CANCELLED')}
          disabled={isPending}
          loading={pendingAction === 'CANCELLED'}
        >
          Cancel
        </Button>
        <button
          onClick={onClear}
          disabled={isPending}
          className="ml-1 rounded p-1 text-white/60 hover:text-white disabled:opacity-40"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
