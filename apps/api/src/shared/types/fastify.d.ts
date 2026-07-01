import type { Role } from '@godigitify/types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      role: Role;
      sid: string;
      departmentId?: string;
      permissions: string[];
    };
  }
}
