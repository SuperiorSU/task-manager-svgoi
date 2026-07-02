/**
 * Super Admin Dashboard Service — org-wide stats, system health, department
 * comparison, audit feed.
 *
 * Mock implementation — task-derived aggregates (org stats, department
 * comparison) are computed from the shared MOCK_TASKS/MOCK_DEPARTMENTS so
 * they stay consistent with every other dashboard in the app. Replace method
 * bodies with real API calls (GET /dashboard/org-stats, GET
 * /dashboard/system-health, GET /departments?includeStats=1, GET /audit)
 * when the backend is ready. Signatures are stable: UI never imports MOCK_*
 * or tasks.mock directly.
 */

import {
  MOCK_DEPARTMENTS,
  MOCK_TASKS,
  MOCK_USERS,
  isTaskOverdue,
} from '../data/tasks.mock';
import {
  MOCK_AUDIT_EVENTS,
  type AuditEvent,
  type DepartmentComparisonEntry,
  type OrgStats,
  type SystemHealth,
} from '../data/superAdminDashboard.mock';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const superAdminDashboardService = {
  async getOrgStats(): Promise<OrgStats> {
    await delay(300);

    const totalTasks = MOCK_TASKS.length;
    const orgCompleted = MOCK_TASKS.filter((t) => t.status === 'COMPLETED').length;
    const orgOverdue = MOCK_TASKS.filter(isTaskOverdue).length;
    const inFlight = MOCK_TASKS.filter(
      (t) => !['COMPLETED', 'CANCELLED'].includes(t.status)
    ).length;

    return {
      totalTasks,
      departments: MOCK_DEPARTMENTS.length,
      orgCompleted,
      orgOverdue,
      inFlight,
      completionRate: totalTasks ? Math.round((orgCompleted / totalTasks) * 100) : 0,
    };
  },

  async getSystemHealth(): Promise<SystemHealth> {
    await delay(300);

    const roster = Object.values(MOCK_USERS);
    const admins = roster.filter((u) => u.designation.startsWith('Head of')).length;

    return {
      activeUsers: roster.length,
      admins,
      departments: MOCK_DEPARTMENTS.length,
    };
  },

  async getDepartmentComparison(): Promise<DepartmentComparisonEntry[]> {
    await delay(300);

    return MOCK_DEPARTMENTS.map((dept) => {
      const deptTasks = MOCK_TASKS.filter((t) => t.department.id === dept.id);
      const completed = deptTasks.filter((t) => t.status === 'COMPLETED').length;
      const completionRate = deptTasks.length
        ? Math.round((completed / deptTasks.length) * 100)
        : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        completionRate,
        taskCount: deptTasks.length,
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  },

  async getAuditFeed(): Promise<AuditEvent[]> {
    await delay(300);
    return MOCK_AUDIT_EVENTS;
  },
};
