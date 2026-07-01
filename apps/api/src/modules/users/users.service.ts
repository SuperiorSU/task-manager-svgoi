import { prisma } from '../../config/database.js';
import { hashPassword } from '../../utils/bcrypt.utils.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { ROLE_PERMISSIONS } from '../../shared/guards/permissions.js';

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

    const tempPassword = `Svgoi@${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await hashPassword(tempPassword);

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

    // TODO: send welcome email with temp password
    console.warn(`[DEV] Temp password for ${user.email}: ${tempPassword}`);

    return user;
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

  async registerPushToken(userId: string, token: string, platform: string) {
    await prisma.pushToken.upsert({
      where: { token },
      create: { token, platform, userId },
      update: { userId, updatedAt: new Date() },
    });
  },
};
