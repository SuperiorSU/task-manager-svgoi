import crypto from 'crypto';

import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { verifyPassword, hashPassword } from '../../utils/bcrypt.utils.js';
import { hashToken, generateResetToken, generateSessionId } from '../../utils/jwt.utils.js';
import { writeAuditLog } from '../../utils/audit.utils.js';

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
  permissions: { select: { permission: true } },
  department: { select: { id: true, name: true, code: true } },
  manager: { select: { id: true, name: true } },
} as const;

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_TTL = 60 * 15; // 15 minutes

export const authService = {
  async login(
    employeeId: string,
    password: string,
    ip: string,
    userAgent: string,
    app: FastifyInstance
  ) {
    const lockKey = `login_lockout:${employeeId}`;
    const attemptsKey = `login_attempts:${employeeId}`;

    // Redis lockout check — skip gracefully if Redis is unavailable
    try {
      const isLocked = await redis.exists(lockKey);
      if (isLocked) {
        throw Object.assign(new Error('Too many failed attempts. Try again in 15 minutes.'), {
          statusCode: 429,
          code: 'RATE_LIMITED',
        });
      }
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'RATE_LIMITED') throw err;
      // Redis unavailable — log and continue without lockout check
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ employeeId }, { email: employeeId }] },
      select: { ...safeUserSelect, passwordHash: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      // Track failed attempts — fire-and-forget if Redis is down
      void redis.incr(attemptsKey).then(async (attempts) => {
        if (attempts === 1) await redis.expire(attemptsKey, LOCKOUT_TTL);
        if (attempts >= LOCKOUT_ATTEMPTS) {
          await redis.setex(lockKey, LOCKOUT_TTL, '1');
          await redis.del(attemptsKey);
        }
      }).catch(() => { /* Redis unavailable — skip lockout tracking */ });

      await writeAuditLog({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: employeeId,
        description: `Failed login attempt for ${employeeId}`,
        ipAddress: ip,
        userAgent,
      });
      throw Object.assign(new Error('Employee ID or password is incorrect'), { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Your account has been deactivated. Contact HR.'), {
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    }

    // Clear lockout counters — fire-and-forget
    void redis.del(attemptsKey, lockKey).catch(() => {});

    const sessionId = generateSessionId();
    const accessToken = app.jwt.sign(
      { sub: user.id, role: user.role, sid: sessionId },
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );
    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.$transaction([
      prisma.refreshToken.create({
        data: { token: refreshTokenHash, userId: user.id, expiresAt },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    await writeAuditLog({
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `${user.name} logged in`,
      actorId: user.id,
      ipAddress: ip,
      userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      tokens: { accessToken, refreshToken: rawRefreshToken },
      user: { ...safeUser, permissions: safeUser.permissions.map((p) => p.permission) },
    };
  },

  async refresh(rawRefreshToken: string, app: FastifyInstance) {
    const tokenHash = hashToken(rawRefreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid or expired refresh token'), {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: stored.userId, isActive: true },
      select: { id: true, role: true },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    // Rotate: revoke old, issue new
    const sessionId = generateSessionId();
    const newRaw = crypto.randomBytes(48).toString('hex');
    const newHash = hashToken(newRaw);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: { token: newHash, userId: user.id, expiresAt },
      }),
    ]);

    const accessToken = app.jwt.sign(
      { sub: user.id, role: user.role, sid: sessionId },
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    return { accessToken, refreshToken: newRaw };
  },

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { token: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async forgotPassword(email: string): Promise<void> {
    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const { raw, hash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Store reset token in Redis (15 min TTL) to avoid a separate table
    await redis.setex(`reset:${hash}`, 60 * 15, user.id);

    // TODO: send email with reset link containing `raw` token
    console.warn(`[DEV] Password reset token for ${email}: ${raw}`);
    void expiresAt;
  },

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hash = hashToken(rawToken);
    const userId = await redis.get(`reset:${hash}`);

    if (!userId) {
      throw Object.assign(new Error('Reset token is invalid or has expired'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await redis.del(`reset:${hash}`);
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw Object.assign(new Error('Current password is incorrect'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    return { ...user, permissions: user.permissions.map((p) => p.permission) };
  },
};
