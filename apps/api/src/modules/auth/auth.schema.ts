export const loginBodySchema = {
  type: 'object',
  required: ['employeeId', 'password'],
  additionalProperties: false,
  properties: {
    employeeId: { type: 'string', minLength: 1, maxLength: 50 },
    password: { type: 'string', minLength: 1, maxLength: 128 },
  },
} as const;

export const refreshBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    // Optional: mobile sends it in the body, web sends it as an httpOnly cookie.
    refreshToken: { type: 'string', minLength: 1 },
  },
} as const;

export const forgotPasswordBodySchema = {
  type: 'object',
  required: ['email'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
  },
} as const;

export const resetPasswordBodySchema = {
  type: 'object',
  required: ['token', 'password'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', minLength: 64, maxLength: 64 },
    password: { type: 'string', minLength: 8, maxLength: 128 },
  },
} as const;

export const verifyLoginBodySchema = {
  type: 'object',
  required: ['challengeId', 'code'],
  additionalProperties: false,
  properties: {
    challengeId: { type: 'string', minLength: 1, maxLength: 64 },
    code: { type: 'string', pattern: '^[0-9]{6}$' },
    trustDevice: { type: 'boolean' },
  },
} as const;

export const resendLoginBodySchema = {
  type: 'object',
  required: ['challengeId'],
  additionalProperties: false,
  properties: {
    challengeId: { type: 'string', minLength: 1, maxLength: 64 },
  },
} as const;

export const inviteQuerySchema = {
  type: 'object',
  required: ['token'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', minLength: 64, maxLength: 64 },
  },
} as const;

export const acceptInviteBodySchema = {
  type: 'object',
  required: ['token', 'password'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', minLength: 64, maxLength: 64 },
    password: { type: 'string', minLength: 8, maxLength: 128 },
  },
} as const;

export const changePasswordBodySchema = {
  type: 'object',
  required: ['currentPassword', 'newPassword'],
  additionalProperties: false,
  properties: {
    currentPassword: { type: 'string', minLength: 1, maxLength: 128 },
    newPassword: { type: 'string', minLength: 8, maxLength: 128 },
  },
} as const;
