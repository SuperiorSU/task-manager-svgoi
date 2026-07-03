export type Department = {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  headId?: string;
  createdAt: string;
  updatedAt: string;
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
