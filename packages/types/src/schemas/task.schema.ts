import { z } from 'zod';

const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const taskStatusEnum = z.enum([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'COMPLETED',
  'CANCELLED',
]);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(5000).optional(),
  priority: taskPriorityEnum,
  dueDate: z.string().datetime({ message: 'Invalid date format' }),
  assigneeId: z.string().cuid(),
  departmentId: z.string().cuid().optional(),
  isRecurring: z.boolean().default(false),
  recurringConfig: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
      interval: z.number().int().min(1),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusEnum,
  comment: z.string().max(1000).optional(),
});

export const taskFiltersSchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  departmentId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'title']).default('dueDate'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
