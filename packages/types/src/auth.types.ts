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
