import type { FastifyReply } from 'fastify';

import { env } from '../config/env.js';

// httpOnly session cookies for the web client. Mobile ignores these (it reads
// tokens from the response body), so setting them on every login/refresh is
// harmless there and lets one endpoint serve both surfaces.
const ACCESS_MAX_AGE = 15 * 60; // 15m — matches JWT_ACCESS_EXPIRES_IN
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7d — matches refresh token lifetime

const base = {
  httpOnly: true,
  // Dev is http://localhost (same-site, different port), so `secure` must be
  // off or the browser drops the cookie. HTTPS in prod flips it on.
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const setAuthCookies = (
  reply: FastifyReply,
  tokens: { accessToken: string; refreshToken: string }
): void => {
  reply.setCookie('access_token', tokens.accessToken, { ...base, maxAge: ACCESS_MAX_AGE });
  reply.setCookie('refresh_token', tokens.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
};

export const clearAuthCookies = (reply: FastifyReply): void => {
  reply.clearCookie('access_token', { ...base });
  reply.clearCookie('refresh_token', { ...base });
};

// "Trust this device" — lets a browser skip the OTP for 30 days. The value is a
// server-validated bearer (userId.rawToken); only its hash is stored server-side.
export const setTrustedDeviceCookie = (reply: FastifyReply, value: string): void => {
  reply.setCookie('trusted_device', value, { ...base, maxAge: 30 * 24 * 60 * 60 });
};
