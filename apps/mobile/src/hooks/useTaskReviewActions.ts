import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { MockTask } from '../data/tasks.mock';
import { adminTasksService } from '../services/adminTasks.service';

type ReviewTarget = Pick<MockTask, 'id'> | null | undefined;

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
  const [loading, setLoading] = useState(false);

  const openRevision = useCallback(() => setRevisionVisible(true), []);
  const closeRevision = useCallback(() => setRevisionVisible(false), []);

  const approve = useCallback(async () => {
    if (!task) return;
    setLoading(true);
    try {
      await adminTasksService.approveTask(task.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setApprovedVisible(true);
    } catch {
      Alert.alert('Error', 'Could not approve the task. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [task]);

  const submitRevision = useCallback(async (note: string) => {
    if (!task) return;
    setLoading(true);
    try {
      await adminTasksService.requestRevision(task.id, note);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRevisionVisible(false);
      options.onRevised?.();
    } catch {
      Alert.alert('Error', 'Could not request revision. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [task, options]);

  const closeApproved = useCallback(() => {
    setApprovedVisible(false);
    options.onApproved?.();
  }, [options]);

  return {
    loading,
    revisionVisible,
    approvedVisible,
    openRevision,
    closeRevision,
    approve,
    submitRevision,
    closeApproved,
  };
}
