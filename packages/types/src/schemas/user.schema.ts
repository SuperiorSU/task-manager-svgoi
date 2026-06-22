import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1).max(100),
  employeeId: z.string().min(1).max(50),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional(),
  designation: z.string().max(100).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
  departmentId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ role: true });

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional(),
  designation: z.string().max(100).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
