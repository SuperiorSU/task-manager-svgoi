/**
 * Super Admin Tasks (Oversight) Service — governance summary tile only.
 *
 * Department health, staff load, escalations and org overview have moved to
 * real backend calls (see apps/mobile/src/hooks/useSuperAdminTasks.ts, which
 * calls dashboardApi.getDeptHealth/getStaffLoad/getEscalations directly and
 * no longer goes through this service). Staff task list/detail also moved —
 * they now use tasksApi.getList/getById/getActivity, filtered by assigneeId.
 *
 * The SA's own governance list/detail/create/approve/revise flow
 * (GovernanceTasksScreen, AssignGovernanceTaskScreen,
 * useGovernanceReviewActions.ts) has separately moved to the real
 * governanceApi via hooks/useGovernance.ts. All that's left mock-backed here
 * is getGovernanceTaskGroups(), which feeds the "Assigned by me" summary
 * tile on the org-wide oversight tab (SuperAdminTasksScreen) — unrelated to
 * those screens.
 */

import { type MockTask } from '../data/tasks.mock';
import { MOCK_GOVERNANCE_TASKS } from '../data/superAdminTasks.mock';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Types ────────────────────────────────────────────────────────────────────

export type GovernanceTaskGroup = {
  id: 'needs_approval' | 'in_progress' | 'awaiting_accept';
  label: string;
  count: number;
  tasks: MockTask[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupGovernanceTasks(tasks: MockTask[]): GovernanceTaskGroup[] {
  const needsApproval = tasks.filter((t) => t.status === 'UNDER_REVIEW');
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED');
  const awaitingAccept = tasks.filter((t) => t.status === 'PENDING');

  const groups: GovernanceTaskGroup[] = [];
  if (needsApproval.length) {
    groups.push({ id: 'needs_approval', label: 'Needs your approval', count: needsApproval.length, tasks: needsApproval });
  }
  if (inProgress.length) {
    groups.push({ id: 'in_progress', label: 'In progress', count: inProgress.length, tasks: inProgress });
  }
  if (awaitingAccept.length) {
    groups.push({ id: 'awaiting_accept', label: 'Awaiting accept', count: awaitingAccept.length, tasks: awaitingAccept });
  }
  return groups;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const superAdminTasksService = {
  async getGovernanceTaskGroups(): Promise<GovernanceTaskGroup[]> {
    await delay(300);
    return groupGovernanceTasks(MOCK_GOVERNANCE_TASKS);
  },
};
