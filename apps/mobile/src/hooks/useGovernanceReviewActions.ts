import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { MockTask } from '../data/tasks.mock';
import { superAdminTasksService } from '../services/superAdminTasks.service';

type ReviewTarget = Pick<MockTask, 'id'> | null | undefined;

type Options = {
  onApproved?: () => void;
  onRevised?: () => void;
};

/**
 * Mirrors useTaskReviewActions.ts (Admin's approve/revise workflow for the
 * Individual/Batch progress screens) but targets superAdminTasksService's
 * governance-task methods instead of adminTasksService. Kept as a separate
 * hook rather than parameterizing the existing one — that hook is owned by
 * an already-completed Admin flow and is off-limits to modify; duplicating
 * ~40 lines of glue here is cheaper than risking that flow (same tradeoff as
 * the BoldSegments/completionRate extractions in prior SA modules).
 */
export function useGovernanceReviewActions(task: ReviewTarget, options: Options = {}) {
  const [revisionVisible, setRevisionVisible] = useState(false);
  const [approvedVisible, setApprovedVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const openRevision = useCallback(() => setRevisionVisible(true), []);
  const closeRevision = useCallback(() => setRevisionVisible(false), []);

  const approve = useCallback(async () => {
    if (!task) return;
    setLoading(true);
    try {
      await superAdminTasksService.approveGovernanceTask(task.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setApprovedVisible(true);
    } catch {
      Alert.alert('Error', 'Could not approve the task. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [task]);

  const submitRevision = useCallback(
    async (note: string) => {
      if (!task) return;
      setLoading(true);
      try {
        await superAdminTasksService.requestGovernanceRevision(task.id, note);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRevisionVisible(false);
        options.onRevised?.();
      } catch {
        Alert.alert('Error', 'Could not request revision. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [task, options]
  );

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
