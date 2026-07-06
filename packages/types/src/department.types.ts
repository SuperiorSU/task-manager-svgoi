import type { Role } from './auth.types';

export type Department = {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  headId?: string;
  createdAt: string;
  updatedAt: string;
  /** Present on GET /departments and GET /departments/:id — matches the API's `deptSelect`. */
  head?: { id: string; name: string } | null;
  _count?: { users: number; tasks: number };
};

export type DepartmentSettings = {
  id: string;
  departmentId: string;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
  weeklyHoliday: number;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultDueWindowDays: number;
  membersSeeOnlyOwnTasks: boolean;
  taskCategories: string[];
  requireProofOfWork: boolean;
  autoApproveLowPriority: boolean;
  onRejection: string;
  approverScope: string;
  reviewWithinHours: number;
  escalateOverdueReviews: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateDepartmentSettingsDto = Partial<
  Omit<DepartmentSettings, 'id' | 'departmentId' | 'createdAt' | 'updatedAt'>
>;

export type CreateDepartmentDto = {
  name: string;
  code: string;
  description?: string;
  headId?: string;
  settings?: UpdateDepartmentSettingsDto;
};

/** Head changes go through POST /departments/:id/reassign-head, not this — matches deptSelect's PATCH /:id schema. */
export type UpdateDepartmentDto = {
  name?: string;
  code?: string;
  description?: string;
};

export type ReassignDepartmentHeadDto = {
  newHeadId: string;
};

/** GET /departments/:id/members — matches the API's `memberSelect`. */
export type DepartmentMember = {
  id: string;
  name: string;
  employeeId?: string;
  designation?: string;
  role: Role;
  isActive: boolean;
};
