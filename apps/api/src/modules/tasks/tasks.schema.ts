export const createTaskBodySchema = {
  type: 'object',
  required: ['title', 'priority', 'dueDate', 'assigneeId'],
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 5000 },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    dueDate: { type: 'string', format: 'date-time' },
    assigneeId: { type: 'string' },
    departmentId: { type: 'string' },
    isRecurring: { type: 'boolean', default: false },
    recurringConfig: {
      type: 'object',
      properties: {
        frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'custom'] },
        interval: { type: 'integer', minimum: 1 },
        daysOfWeek: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 6 } },
        dayOfMonth: { type: 'integer', minimum: 1, maximum: 31 },
        endDate: { type: 'string', format: 'date-time' },
      },
      required: ['frequency', 'interval'],
    },
  },
} as const;

export const updateStatusBodySchema = {
  type: 'object',
  required: ['status'],
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'],
    },
    comment: { type: 'string', maxLength: 1000 },
  },
} as const;

export const taskFiltersSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'] },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    departmentId: { type: 'string' },
    assigneeId: { type: 'string' },
    search: { type: 'string', maxLength: 200 },
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    sortBy: { type: 'string', enum: ['dueDate', 'priority', 'createdAt', 'title'], default: 'dueDate' },
    order: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
  },
} as const;

export const assignBodySchema = {
  type: 'object',
  required: ['assigneeId'],
  additionalProperties: false,
  properties: {
    assigneeId: { type: 'string' },
    reason: { type: 'string', maxLength: 500 },
  },
} as const;

export const bulkStatusBodySchema = {
  type: 'object',
  required: ['ids', 'status'],
  additionalProperties: false,
  properties: {
    ids: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 50 },
    status: { type: 'string', enum: ['CANCELLED'] },
  },
} as const;
