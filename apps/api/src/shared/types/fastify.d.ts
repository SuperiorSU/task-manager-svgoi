import type { Role } from '@godigitify/types';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      role: Role;
      sid: string;
      departmentId?: string;
      permissions: string[];
    };
  }
}
