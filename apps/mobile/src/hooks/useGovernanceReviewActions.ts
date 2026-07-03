import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { GovernanceTask } from '@godigitify/types';

import { useApproveGovernanceTask, useRequestGovernanceRevision } from './useGovernance';

type ReviewTarget = Pick<GovernanceTask, 'id'> | null | undefined;

type Options = {
  onApproved?: () => void;
  onRevised?: () => void;
};

/**
 * Mirrors useTaskReviewActions.ts (Admin's approve/revise workflow for the
 * Individual/Batch progress screens) but targets governanceApi (via
 * useGovernance.ts's mutations) instead of adminTasksService. Kept as a
 * separate hook rather than parameterizing the existing one — that hook is
 * owned by an already-completed Admin flow and is off-limits to modify;
 * duplicating ~40 lines of glue here is cheaper than risking that flow (same
 * tradeoff as the BoldSegments/completionRate extractions in prior SA
 * modules).
 */
export function useGovernanceReviewActions(task: ReviewTarget, options: Options = {}) {
  const [revisionVisible, setRevisionVisible] = useState(false);
  const [approvedVisible, setApprovedVisible] = useState(false);

  const approveMutation = useApproveGovernanceTask();
  const revisionMutation = useRequestGovernanceRevision();
  const loading = approveMutation.isPending || revisionMutation.isPending;

  const openRevision = useCallback(() => setRevisionVisible(true), []);
  const closeRevision = useCallback(() => setRevisionVisible(false), []);

  const approve = useCallback(async () => {
    if (!task) return;
    try {
      await approveMutation.mutateAsync(task.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setApprovedVisible(true);
    } catch {
      Alert.alert('Error', 'Could not approve the task. Please try again.');
    }
  }, [task, approveMutation]);

  const submitRevision = useCallback(
    async (note: string) => {
      if (!task) return;
      try {
        await revisionMutation.mutateAsync({ id: task.id, note });
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRevisionVisible(false);
        options.onRevised?.();
      } catch {
        Alert.alert('Error', 'Could not request revision. Please try again.');
      }
    },
    [task, revisionMutation, options]
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
