import crypto from 'crypto';

import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { hashPassword } from '../../utils/bcrypt.utils.js';
import { generateResetToken } from '../../utils/jwt.utils.js';
import { sendInviteEmail } from '../../utils/email.utils.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { ROLE_PERMISSIONS } from '../../shared/guards/permissions.js';
import { authService } from '../auth/auth.service.js';

/** The link a new member opens to set their first password. */
export const buildInviteLink = (token: string): string => `${env.FRONTEND_URL}/setup?token=${token}`;

// A newly-invited user has 7 days to open their setup link and choose a
// password. Stored as `invite:{hash} -> userId` in Redis (single-use: deleted
// once accepted). Distinct from the 15-min password-RESET token, which is far
// too short for onboarding.
export const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Mints a fresh setup-invite for a user and returns the raw token (shown once
 * to the creating admin so they can relay the setup link). Reused by create and
 * by any future "resend invite".
 */
export const createInviteToken = async (userId: string): Promise<{ token: string; expiresAt: string }> => {
  const { raw, hash } = generateResetToken();
  await redis.setex(`invite:${hash}`, INVITE_TTL_SECONDS, userId);
  return { token: raw, expiresAt: new Date(Date.now() + INVITE_TTL_SECONDS * 1000).toISOString() };
};

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  employeeId: true,
  phone: true,
  avatarUrl: true,
  designation: true,
  role: true,
  isActive: true,
  departmentId: true,
  managerId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true, code: true } },
  manager: { select: { id: true, name: true } },
} as const;

type CreateUserInput = {
  email: string;
  name: string;
  employeeId: string;
  phone?: string;
  designation?: string;
  role: 'ADMIN' | 'EMPLOYEE';
  departmentId?: string;
  managerId?: string;
  creatorId: string;
};

export const usersService = {
  async getList(
    viewerRole: string,
    viewerDeptId: string | undefined,
    departmentId?: string
  ) {
    const where: Record<string, unknown> = { isActive: true };
    if (viewerRole === 'ADMIN') where['departmentId'] = viewerDeptId;
    else if (departmentId) where['departmentId'] = departmentId;

    return prisma.user.findMany({
      where: where as never,
      select: safeUserSelect,
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Candidates a task may be assigned/reassigned to.
   *
   * Distinct from getList (user *management*, always department-locked for an
   * ADMIN). Assignment legitimately needs to read across departments, so this
   * returns a narrow projection — no email/phone — per 8_overview.md §13.
   *
   * Scope (§2 assignment matrix):
   *   SUPER_ADMIN → any ADMIN/EMPLOYEE, any department.
   *   ADMIN       → anyone in their own department,
   *                 + any ADMIN in any department (cross-dept admin assignment
   *                   is always allowed),
   *                 + EMPLOYEEs in other departments only when the org's
   *                   `allowCrossDeptEmployeeAssignment` flag is on.
   * SUPER_ADMIN is never a candidate — tasksService.assign rejects it anyway.
   */
  async getAssignableUsers(
    viewer: { role: string; departmentId?: string },
    filters: { departmentId?: string; search?: string; limit?: number } = {}
  ) {
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20));

    const and: Record<string, unknown>[] = [];

    if (viewer.role === 'ADMIN') {
      // Cross-dept ADMIN assignment is unconditional; cross-dept EMPLOYEE
      // assignment is gated by the org flag (defaults ON per the schema).
      const config = await prisma.organizationConfig.findUnique({
        where: { singleton: 1 },
        select: { allowCrossDeptEmployeeAssignment: true },
      });
      const allowCrossDeptEmployees = config?.allowCrossDeptEmployeeAssignment ?? true;

      const scope: Record<string, unknown>[] = [{ role: 'ADMIN' }];
      if (viewer.departmentId) scope.push({ departmentId: viewer.departmentId });
      if (allowCrossDeptEmployees) scope.push({ role: 'EMPLOYEE' });
      and.push({ OR: scope });
    }

    if (filters.search) {
      // Name/employeeId only — searching by email would let an ADMIN probe the
      // contact details of users outside their department.
      and.push({
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { employeeId: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    return prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['ADMIN', 'EMPLOYEE'] },
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(and.length > 0 ? { AND: and } : {}),
      } as never,
      select: {
        id: true,
        name: true,
        employeeId: true,
        role: true,
        avatarUrl: true,
        designation: true,
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
  },

  async getById(id: string, viewerRole: string, viewerDeptId?: string) {
    const where: Record<string, unknown> = { id };
    if (viewerRole === 'ADMIN') where['departmentId'] = viewerDeptId;

    const user = await prisma.user.findFirst({ where: where as never, select: safeUserSelect });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    return user;
  },

  async create(input: CreateUserInput) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { employeeId: input.employeeId }] },
    });
    if (existing) {
      throw Object.assign(new Error('A user with this email or employee ID already exists'), {
        statusCode: 409,
        code: 'CONFLICT',
      });
    }

    // No temporary password is disclosed to anyone. The account is seeded with
    // an unguessable random secret that nobody knows, so the ONLY way in is via
    // the invite link, where the new member sets their own first password.
    const passwordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        employeeId: input.employeeId,
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.designation !== undefined ? { designation: input.designation } : {}),
        role: input.role as never,
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
        passwordHash,
      },
      select: safeUserSelect,
    });

    // Seed role default permissions
    const rolePerms = ROLE_PERMISSIONS[input.role] ?? [];
    if (rolePerms.length) {
      await prisma.userPermission.createMany({
        data: rolePerms.map((p) => ({ userId: user.id, permission: p })),
        skipDuplicates: true,
      });
    }

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      description: `User ${user.name} (${user.employeeId}) created`,
      actorId: input.creatorId,
    });

    // Mint the setup-invite: emailed to the new member AND handed back to the
    // creating admin (who can also share the link in-app). Email is fire-and-
    // forget — a slow/failed SMTP must never fail user creation.
    const invite = await createInviteToken(user.id);
    void sendInviteEmail(user.email, user.name, buildInviteLink(invite.token));

    return { user, invite };
  },

  async update(id: string, data: Partial<CreateUserInput>, actorId: string) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.designation !== undefined ? { designation: data.designation } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.managerId !== undefined ? { managerId: data.managerId } : {}),
      },
      select: safeUserSelect,
    });

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      description: `User profile updated`,
      actorId,
    });

    return user;
  },

  async deactivate(id: string, actorId: string, actorDeptId?: string) {
    if (id === actorId) {
      throw Object.assign(new Error('You cannot suspend your own account'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { departmentId: true, name: true } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });

    // Admin can only deactivate users in their own dept
    if (actorDeptId && user.departmentId !== actorDeptId) {
      throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { isActive: false } }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      description: `User ${user.name} deactivated`,
      actorId,
    });
  },

  async resetPassword(id: string, actorId: string, actorDeptId?: string) {
    if (id === actorId) {
      throw Object.assign(new Error('Use "Change password" in your profile instead'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true, departmentId: true } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });

    // Admin can only reset passwords for users in their own department
    if (actorDeptId && user.departmentId !== actorDeptId) {
      throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    // Reuses the self-service flow: generates + emails a 15-min single-use reset token
    // and revokes the target's active sessions.
    await authService.forgotPassword(user.email);

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      description: `Password reset triggered for ${user.name}`,
      actorId,
    });
  },

  async registerPushToken(userId: string, token: string, platform: string) {
    await prisma.pushToken.upsert({
      where: { token },
      create: { token, platform, userId },
      update: { userId, updatedAt: new Date() },
    });
  },

  async getNotificationPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({ data: { userId } });
    }
    return prefs;
  },

  async updateNotificationPreferences(userId: string, data: Record<string, unknown>) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data as never,
      create: { userId, ...data } as never,
    });
  },

  async changeRole(id: string, role: 'ADMIN' | 'EMPLOYEE', actorId: string) {
    if (id === actorId) {
      throw Object.assign(new Error('You cannot change your own role'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, headOfDept: { select: { id: true } } },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });

    if (user.role === role) {
      return prisma.user.findUnique({ where: { id }, select: safeUserSelect });
    }

    if (user.headOfDept && role !== 'ADMIN') {
      throw Object.assign(
        new Error('Reassign the department head before changing this user’s role'),
        { statusCode: 409, code: 'CONFLICT' }
      );
    }

    const oldRole = user.role;
    const rolePerms = ROLE_PERMISSIONS[role] ?? [];

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({ where: { id }, data: { role: role as never }, select: safeUserSelect });
      await tx.userPermission.deleteMany({ where: { userId: id } });
      if (rolePerms.length) {
        await tx.userPermission.createMany({
          data: rolePerms.map((p) => ({ userId: id, permission: p })),
          skipDuplicates: true,
        });
      }
      return result;
    });

    await writeAuditLog({
      action: 'ROLE_CHANGED',
      entityType: 'User',
      entityId: id,
      description: `${user.name} role changed from ${oldRole} to ${role}`,
      actorId,
      metadata: { from: oldRole, to: role },
    });

    return updated;
  },
};
