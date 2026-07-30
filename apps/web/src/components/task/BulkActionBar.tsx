'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BulkBar } from '@/components/shared/BulkBar';
import { useBulkUpdateStatus, useBulkDeleteTasks } from '@/hooks/useTasks';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

type Props = {
  selectedIds: string[];
  onClear: () => void;
};

type PendingAction = 'cancel' | 'delete' | null;

export const BulkActionBar = ({ selectedIds, onClear }: Props) => {
  const { hasPermission } = usePermissions();
  const { mutate: bulkUpdate, isPending: isCancelling } = useBulkUpdateStatus();
  const { mutate: bulkDelete, isPending: isDeleting } = useBulkDeleteTasks();
  const [pending, setPending] = useState<PendingAction>(null);

  const count = selectedIds.length;
  const canDelete = hasPermission(PERMISSIONS.TASK_DELETE);

  const done = () => { onClear(); setPending(null); };

  // Cancel is the only safe bulk status change — the server only accepts
  // CANCELLED here; other transitions are per-task / assignee-driven.
  const runCancel = () =>
    bulkUpdate({ taskIds: selectedIds, status: 'CANCELLED' }, { onSuccess: done });

  const runDelete = () =>
    bulkDelete(selectedIds, { onSuccess: done });

  return (
    <>
      <BulkBar count={count} onClear={onClear}>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setPending('cancel')}
        >
          Cancel tasks
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-300 hover:bg-white/10"
            onClick={() => setPending('delete')}
          >
            Delete
          </Button>
        )}
      </BulkBar>

      <ConfirmDialog
        open={pending === 'cancel'}
        onClose={() => setPending(null)}
        onConfirm={runCancel}
        title={`Cancel ${count} task${count === 1 ? '' : 's'}?`}
        message="Cancelled tasks are removed from active work and can't be reopened. Tasks that are already completed or cancelled are left unchanged."
        confirmLabel="Cancel tasks"
        loading={isCancelling}
      />

      <ConfirmDialog
        open={pending === 'delete'}
        onClose={() => setPending(null)}
        onConfirm={runDelete}
        title={`Delete ${count} task${count === 1 ? '' : 's'}?`}
        message="Deleted tasks are removed from all lists and reports. This can't be undone from here."
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </>
  );
};
