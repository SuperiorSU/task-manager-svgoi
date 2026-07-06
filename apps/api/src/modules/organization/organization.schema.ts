export const updateOrgConfigBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    orgName: { type: 'string', minLength: 1, maxLength: 100 },
    allowCrossDeptEmployeeAssignment: { type: 'boolean' },
    workingDays: {
      type: 'array',
      items: { type: 'integer', minimum: 0, maximum: 6 },
    },
    workingHoursStart: { type: 'string' },
    workingHoursEnd: { type: 'string' },
    weeklyHoliday: { type: 'integer', minimum: 0, maximum: 6 },
    defaultPriority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    defaultDueWindowDays: { type: 'integer', minimum: 1 },
    taskCategories: { type: 'array', items: { type: 'string' } },
    requireProofOfWork: { type: 'boolean' },
    autoApproveLowPriority: { type: 'boolean' },
    onRejection: { type: 'string' },
    approverScope: { type: 'string' },
    reviewWithinHours: { type: 'integer', minimum: 1 },
    escalateOverdueReviews: { type: 'boolean' },
  },
} as const;
