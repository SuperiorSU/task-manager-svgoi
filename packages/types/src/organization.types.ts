export type OrganizationConfig = {
  id: string;
  orgName: string;
  allowCrossDeptEmployeeAssignment: boolean;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
  weeklyHoliday: number;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultDueWindowDays: number;
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

export type UpdateOrganizationConfigDto = Partial<
  Omit<OrganizationConfig, 'id' | 'createdAt' | 'updatedAt'>
>;
