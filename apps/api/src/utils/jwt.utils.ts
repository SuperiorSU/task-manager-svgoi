import crypto from 'crypto';

import type { TokenPayload } from '@godigitify/types';

export const generateSessionId = (): string => crypto.randomUUID();

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const generateResetToken = (): { raw: string; hash: string } => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(raw);
  return { raw, hash };
};

export const extractPayload = (decoded: unknown): TokenPayload => decoded as TokenPayload;
