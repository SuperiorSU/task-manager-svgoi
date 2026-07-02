/**
 * Admin Settings Service — Approval preferences + Department settings.
 *
 * Mock implementation — replace method bodies with real API calls
 * (PATCH /departments/:id/approval-preferences, PATCH /departments/:id/settings)
 * when the backend is ready. Signatures are stable: UI never imports MOCK_* directly.
 */

import {
  MOCK_APPROVAL_PREFERENCES,
  MOCK_DEPARTMENT_SETTINGS,
  type ApprovalPreferences,
  type DepartmentSettings,
} from '../data/adminSettings.mock';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// In-memory store to support edits during the session
let _approvalPreferences: ApprovalPreferences = { ...MOCK_APPROVAL_PREFERENCES };
let _departmentSettings: DepartmentSettings = {
  ...MOCK_DEPARTMENT_SETTINGS,
  taskCategories: [...MOCK_DEPARTMENT_SETTINGS.taskCategories],
};

export const adminSettingsService = {
  async getApprovalPreferences(): Promise<ApprovalPreferences> {
    await delay(300);
    return _approvalPreferences;
  },

  async updateApprovalPreferences(
    patch: Partial<ApprovalPreferences>
  ): Promise<ApprovalPreferences> {
    await delay(300);
    _approvalPreferences = { ..._approvalPreferences, ...patch };
    return _approvalPreferences;
  },

  async getDepartmentSettings(): Promise<DepartmentSettings> {
    await delay(300);
    return _departmentSettings;
  },

  async updateDepartmentSettings(
    patch: Partial<DepartmentSettings>
  ): Promise<DepartmentSettings> {
    await delay(300);
    _departmentSettings = { ..._departmentSettings, ...patch };
    return _departmentSettings;
  },
};
