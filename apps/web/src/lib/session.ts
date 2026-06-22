import { cookies } from 'next/headers';
import type { User } from '@godigitify/types';

export type Session = { user: User };

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = (await cookieStore).get('access_token')?.value;
  if (!token) return null;

  try {
    // Decode JWT payload (no verify — middleware already checked the cookie)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1]!, 'base64url').toString()
    );
    return {
      user: {
        id: payload.sub,
        role: payload.role,
        name: payload.name ?? '',
        email: payload.email ?? '',
        departmentId: payload.departmentId ?? null,
        permissions: payload.permissions ?? [],
      } as User,
    };
  } catch {
    return null;
  }
}
