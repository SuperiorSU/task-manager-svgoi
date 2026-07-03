export const createGovernanceTaskBodySchema = {
  type: 'object',
  required: ['title', 'priority', 'dueDate', 'assigneeId', 'departmentId'],
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 5000 },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    dueDate: { type: 'string', format: 'date-time' },
    assigneeId: { type: 'string' },
    departmentId: { type: 'string' },
  },
} as const;

export const governanceFiltersSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'] },
    departmentId: { type: 'string' },
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
} as const;

export const requestRevisionBodySchema = {
  type: 'object',
  required: ['note'],
  additionalProperties: false,
  properties: {
    note: { type: 'string', minLength: 1, maxLength: 1000 },
  },
} as const;
