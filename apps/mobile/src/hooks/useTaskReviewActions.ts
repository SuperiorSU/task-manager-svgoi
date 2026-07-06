import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';

import type { RichTask } from '@godigitify/types';
import { useUpdateTaskStatus } from './useTasks';

type ReviewTarget = Pick<RichTask, 'id'> | null | undefined;

type Options = {
  /** Called once the "Approved" confirmation dialog is dismissed. */
  onApproved?: () => void;
  /** Called right after a revision request succeeds (dialog already closed). */
  onRevised?: () => void;
};

/**
 * Shared decision workflow for the Individual Progress (Review Task) screen
 * and the Batch Progress member-copy screen — both let an admin approve a
 * submission or send it back with a reason. Extracted once so the two
 * screens don't duplicate the same approve/revise/confirm sequence.
 */
export function useTaskReviewActions(task: ReviewTarget, options: Options = {}) {
  const [revisionVisible, setRevisionVisible] = useState(false);
  const [approvedVisible, setApprovedVisible] = useState(false);
  const [confirmApproveVisible, setConfirmApproveVisible] = useState(false);
  const updateStatus = useUpdateTaskStatus();

  const openRevision = useCallback(() => setRevisionVisible(true), []);
  const closeRevision = useCallback(() => setRevisionVisible(false), []);

  // COMPLETED is a terminal status (no transition back out per the state
  // machine) and immediately notifies the assignee — gate it behind an
  // explicit confirm step rather than firing on the first tap.
  const requestApprove = useCallback(() => setConfirmApproveVisible(true), []);
  const cancelApprove = useCallback(() => setConfirmApproveVisible(false), []);

  const approve = useCallback(async () => {
    if (!task) return;
    setConfirmApproveVisible(false);
    updateStatus.mutate(
      { id: task.id, dto: { status: 'COMPLETED' } },
      {
        onSuccess: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setApprovedVisible(true);
        },
        // Error toast already shown by useUpdateTaskStatus (useApiMutation).
      }
    );
  }, [task, updateStatus]);

  const submitRevision = useCallback(async (note: string) => {
    if (!task) return;
    updateStatus.mutate(
      { id: task.id, dto: { status: 'IN_PROGRESS', ...(note ? { comment: note } : {}) } },
      {
        onSuccess: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setRevisionVisible(false);
          options.onRevised?.();
        },
        // Error toast already shown by useUpdateTaskStatus (useApiMutation).
      }
    );
  }, [task, updateStatus, options]);

  const closeApproved = useCallback(() => {
    setApprovedVisible(false);
    options.onApproved?.();
  }, [options]);

  return {
    loading: updateStatus.isPending,
    revisionVisible,
    approvedVisible,
    confirmApproveVisible,
    openRevision,
    closeRevision,
    requestApprove,
    cancelApprove,
    approve,
    submitRevision,
    closeApproved,
  };
}
