export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

export type TokenPayload = {
  sub: string;
  role: Role;
  sid: string;
  iat: number;
  exp: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Returned by POST /auth/login when a second factor is required (web logins):
 * no session is issued until the emailed code is verified via /auth/login/verify.
 */
export type MfaChallenge = {
  mfaRequired: true;
  challengeId: string;
};
