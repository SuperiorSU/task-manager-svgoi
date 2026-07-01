import dayjs from 'dayjs';

import {
  MOCK_DEPARTMENTS,
  MOCK_USERS,
  type MockUser,
  type MockDepartment,
} from '../data/tasks.mock';
import type { TaskPriority } from '@godigitify/types';

// ─── Domain types ─────────────────────────────────────────────────────────────

export type TaskCategory = {
  id: string;
  label: string;
};

export type PickedFile = {
  uri: string;
  name: string;
  size: number;        // bytes
  mimeType: string;
};

export type CreateTaskDraft = {
  title: string;
  description: string;
  departmentId: string;
  assigneeIds: string[];
  priority: TaskPriority;
  dueDate: string;     // ISO date (YYYY-MM-DD)
  dueHour: number;     // 1–12
  dueMinute: number;   // 0–55 (multiples of 5)
  isAfternoon: boolean;  // true = PM, false = AM
  categoryIds: string[];
  attachments: PickedFile[];
  isRecurring: boolean;
};

// ─── Static reference data (swap for API call later) ─────────────────────────

export const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'cat_01', label: 'Maintenance' },
  { id: 'cat_02', label: 'Reporting' },
  { id: 'cat_03', label: 'Audit' },
  { id: 'cat_04', label: 'Administration' },
  { id: 'cat_05', label: 'Training' },
  { id: 'cat_06', label: 'Procurement' },
  { id: 'cat_07', label: 'Safety' },
  { id: 'cat_08', label: 'Compliance' },
];

// Maps each department to its available users.
// Replace with GET /departments/:id/users when backend is live.
const DEPT_USER_MAP: Record<string, MockUser[]> = {
  dept_01: [MOCK_USERS.akumar, MOCK_USERS.rajan, MOCK_USERS.priya],
  dept_02: [MOCK_USERS.sunil, MOCK_USERS.rajan],
  dept_03: [MOCK_USERS.nisha, MOCK_USERS.akumar],
  dept_04: [MOCK_USERS.rsingh, MOCK_USERS.priya],
  dept_05: [MOCK_USERS.rsingh, MOCK_USERS.sunil],
};

const ALL_USERS: MockUser[] = Object.values(MOCK_USERS);

// ─── Simulated network delay ──────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Service ─────────────────────────────────────────────────────────────────
// Every method signature is identical to what the real API client will expose.
// Swap the body (mock → API call) without touching any screen code.

export const createTaskService = {
  /**
   * GET /departments
   * Returns the list of active departments.
   */
  getDepartments: async (): Promise<MockDepartment[]> => {
    await delay(120);
    return MOCK_DEPARTMENTS;
  },

  /**
   * GET /departments/:id/users
   * Returns active users scoped to a given department.
   * Super Admin callers should use getAllUsers() instead.
   */
  getUsersByDepartment: async (deptId: string): Promise<MockUser[]> => {
    await delay(120);
    return DEPT_USER_MAP[deptId] ?? ALL_USERS;
  },

  /**
   * GET /users (org-wide)
   * Used when the caller is a SUPER_ADMIN choosing any assignee.
   */
  getAllUsers: async (): Promise<MockUser[]> => {
    await delay(120);
    return ALL_USERS;
  },

  /**
   * GET /tasks/categories
   * Returns the task category options for the org.
   */
  getCategories: async (): Promise<TaskCategory[]> => {
    await delay(80);
    return TASK_CATEGORIES;
  },

  /**
   * POST /tasks
   * Creates a task and notifies the assignee(s).
   * Returns the new task ID on success.
   */
  submitTask: async (draft: CreateTaskDraft): Promise<{ id: string }> => {
    await delay(900);

    if (!draft.title.trim()) {
      throw new Error('Title is required');
    }
    if (draft.assigneeIds.length === 0) {
      throw new Error('At least one assignee is required');
    }
    if (!draft.dueDate) {
      throw new Error('Due date is required');
    }

    // Verify due date/time is in the future
    const hour24 =
      draft.isAfternoon
        ? draft.dueHour === 12 ? 12 : draft.dueHour + 12
        : draft.dueHour === 12 ? 0 : draft.dueHour;
    const dueDt = dayjs(draft.dueDate)
      .hour(hour24)
      .minute(draft.dueMinute)
      .second(0);
    if (dueDt.isBefore(dayjs())) {
      throw new Error('Due date must be in the future');
    }

    return { id: `task_${Date.now()}` };
  },
};
