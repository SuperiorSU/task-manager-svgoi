import crypto from 'crypto';

import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { verifyPassword, hashPassword } from '../../utils/bcrypt.utils.js';
import { hashToken, generateResetToken, generateSessionId } from '../../utils/jwt.utils.js';
import { sendPasswordResetEmail, sendLoginOtpEmail } from '../../utils/email.utils.js';
import { isPlatformMismatch, PLATFORM_LOCK_MESSAGE } from '../../shared/guards/platformLock.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { presentUserAvatar } from '../../utils/avatar.utils.js';

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  employeeId: true,
  phone: true,
  avatarUrl: true,
  avatarKey: true,
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

// ── 2FA (email OTP) ───────────────────────────────────────────────────────────
const MFA_TTL = 5 * 60; // login OTP valid 5 minutes
const MFA_MAX_ATTEMPTS = 5; // wrong guesses before the challenge is burned
const TRUSTED_DEVICE_TTL = 30 * 24 * 60 * 60; // "trust this device" — 30 days

/** 6-digit, zero-padded, from a CSPRNG. */
const generateOtpCode = (): string => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

// Dev convenience: the seeded accounts use example inboxes you can't read, so
// print the code (with its challengeId, so you can correlate) to the API
// console. Never logged in production.
const logOtpDev = (email: string, challengeId: string, code: string): void => {
  if (env.NODE_ENV !== 'production') {
    console.warn(`[DEV] Login OTP for ${email} (challenge ${challengeId}): ${code}`);
  }
};

/** Store a fresh challenge (code hashed, never plaintext) and email the code. */
const createMfaChallenge = async (userId: string, email: string, name: string): Promise<string> => {
  const challengeId = crypto.randomUUID();
  const code = generateOtpCode();
  await redis.setex(`mfa:${challengeId}`, MFA_TTL, JSON.stringify({ userId, codeHash: hashToken(code), attempts: 0 }));
  void sendLoginOtpEmail(email, name, code);
  logOtpDev(email, challengeId, code);
  return challengeId;
};

/**
 * Mint a trusted-device record: the raw token lives only in the browser cookie;
 * the server stores just its hash, so the cookie is a bearer for THIS record.
 * Cookie value is `userId.rawToken` (userId scopes the check to one account).
 */
const createTrustedDevice = async (userId: string): Promise<string> => {
  const raw = crypto.randomBytes(24).toString('hex');
  await redis.setex(`trusted:${userId}:${hashToken(raw)}`, TRUSTED_DEVICE_TTL, '1');
  return `${userId}.${raw}`;
};

const isTrustedDevice = async (userId: string, cookieVal: string | undefined): Promise<boolean> => {
  if (!cookieVal) return false;
  const [uid, raw] = cookieVal.split('.');
  if (uid !== userId || !raw) return false;
  return (await redis.exists(`trusted:${userId}:${hashToken(raw)}`)) === 1;
};

export const authService = {
  async login(
    employeeId: string,
    password: string,
    ip: string,
    userAgent: string,
    app: FastifyInstance,
    opts?: { requireMfa?: boolean; trustedDeviceCookie?: string | undefined; platform?: string | undefined }
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
      void redis.incr(attemptsKey).then(async (attempts: number) => {
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

    // Platform lock BEFORE the 2FA gate, so a wrong-surface account (e.g. an
    // EMPLOYEE on web) is rejected up front and never triggers an OTP email.
    if (isPlatformMismatch(user.role, opts?.platform)) {
      throw Object.assign(new Error(PLATFORM_LOCK_MESSAGE), { statusCode: 403, code: 'FORBIDDEN' });
    }

    // ── 2FA gate ──────────────────────────────────────────────────────────────
    // Web logins (only elevated roles reach web, per platform-lock) require an
    // emailed OTP as a second factor — unless this browser is a trusted device.
    if (opts?.requireMfa && !(await isTrustedDevice(user.id, opts.trustedDeviceCookie))) {
      const challengeId = await createMfaChallenge(user.id, user.email, user.name);
      return { mfaRequired: true as const, challengeId };
    }

    return authService.issueSession(user, ip, userAgent, app);
  },

  /**
   * Creates the session (refresh token row + signed JWT) and returns the tokens
   * + safe user. Split out of `login` so the 2FA verify step can issue the
   * session only AFTER the second factor is confirmed.
   */
  async issueSession(
    user: {
      id: string;
      role: string;
      name: string;
      passwordHash: string;
      permissions: { permission: string }[];
    } & Record<string, unknown>,
    ip: string,
    userAgent: string,
    app: FastifyInstance
  ) {
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

    const { passwordHash: _pw, permissions, ...safeUser } = user;
    return {
      tokens: { accessToken, refreshToken: rawRefreshToken },
      user: await presentUserAvatar({ ...safeUser, permissions: permissions.map((p) => p.permission) }),
    };
  },

  /** Verify the emailed OTP for a login challenge, then issue the session. */
  async verifyLoginOtp(
    challengeId: string,
    code: string,
    ip: string,
    userAgent: string,
    app: FastifyInstance,
    trustDevice: boolean
  ) {
    const key = `mfa:${challengeId}`;
    const raw = await redis.get(key);
    if (!raw) {
      throw Object.assign(new Error('This code has expired. Please sign in again.'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const data = JSON.parse(raw) as { userId: string; codeHash: string; attempts: number };

    if (data.attempts >= MFA_MAX_ATTEMPTS) {
      await redis.del(key);
      throw Object.assign(new Error('Too many incorrect codes. Please sign in again.'), {
        statusCode: 429,
        code: 'RATE_LIMITED',
      });
    }

    if (hashToken(code) !== data.codeHash) {
      data.attempts += 1;
      // KEEPTTL: a wrong guess must not extend the 5-minute window.
      await redis.set(key, JSON.stringify(data), 'KEEPTTL');
      throw Object.assign(new Error('That code is incorrect. Try again.'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    await redis.del(key);

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { ...safeUserSelect, passwordHash: true },
    });
    if (!user || !user.isActive) {
      throw Object.assign(new Error('Account is no longer available'), { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const session = await authService.issueSession(user, ip, userAgent, app);
    const trustedToken = trustDevice ? await createTrustedDevice(user.id) : undefined;
    return { ...session, ...(trustedToken ? { trustedToken } : {}) };
  },

  /** Re-issue a fresh OTP for an in-flight challenge (rate-limited at the route). */
  async resendLoginOtp(challengeId: string) {
    const key = `mfa:${challengeId}`;
    const raw = await redis.get(key);
    if (!raw) {
      throw Object.assign(new Error('This login attempt expired. Please sign in again.'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const { userId } = JSON.parse(raw) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) throw Object.assign(new Error('Account not found'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    // Reuse the same challengeId so the client's in-progress screen stays valid.
    const code = generateOtpCode();
    await redis.setex(key, MFA_TTL, JSON.stringify({ userId, codeHash: hashToken(code), attempts: 0 }));
    void sendLoginOtpEmail(user.email, user.name, code);
    logOtpDev(user.email, challengeId, code);
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

    // Email the reset link. Fire-and-forget + always-success response above keeps
    // the endpoint from leaking whether the address exists.
    void sendPasswordResetEmail(user.email, user.name, `${env.FRONTEND_URL}/reset-password?token=${raw}`);
    void expiresAt;
  },

  /**
   * Look up a setup-invite token so the (public) setup screen can greet the new
   * member by name before they choose a password. Throws on an invalid/expired
   * token so the screen can show a clear "link expired" state.
   */
  async getInvite(rawToken: string): Promise<{ name: string; email: string; employeeId: string }> {
    const hash = hashToken(rawToken);
    const userId = await redis.get(`invite:${hash}`);
    if (!userId) {
      throw Object.assign(new Error('This invite link is invalid or has expired'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, employeeId: true, isActive: true },
    });
    if (!user || !user.isActive) {
      // Account was deleted/deactivated after the invite was sent.
      await redis.del(`invite:${hash}`);
      throw Object.assign(new Error('This invite is no longer valid'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    return { name: user.name, email: user.email, employeeId: user.employeeId ?? '' };
  },

  /**
   * Accept a setup-invite: the new member sets their first password. Single-use
   * — the token is consumed on success. Mirrors resetPassword but keyed off the
   * long-lived `invite:` namespace instead of the 15-min `reset:` one.
   */
  async acceptInvite(rawToken: string, newPassword: string): Promise<void> {
    const hash = hashToken(rawToken);
    const userId = await redis.get(`invite:${hash}`);
    if (!userId) {
      throw Object.assign(new Error('This invite link is invalid or has expired'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    await redis.del(`invite:${hash}`);
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
    return presentUserAvatar({ ...user, permissions: user.permissions.map((p) => p.permission) });
  },
};
