// Platform lock (8_overview.md §11 / 9_overall_fix.md §5): PLATFORM_MANAGER is
// web-only, EMPLOYEE is mobile-only; ADMIN/SUPER_ADMIN use both. This is a
// UX/policy lock (the header isn't a secret) — the real protection is that the
// wrong-surface role simply has no useful routes there.

const ROLE_PLATFORM: Record<string, 'web' | 'mobile' | 'both'> = {
  PLATFORM_MANAGER: 'web',
  SUPER_ADMIN: 'both',
  ADMIN: 'both',
  EMPLOYEE: 'mobile',
};

/**
 * True when this role must not be used on the given client platform.
 *
 * Lenient on a MISSING header (returns false) so a client that hasn't started
 * sending `x-client-platform` isn't locked out during rollout — a real browser
 * always sends 'web' and the app always sends 'mobile', which is what actually
 * matters. Tighten to fail-closed once every client reliably sends it.
 */
export const isPlatformMismatch = (role: string, platform: string | undefined): boolean => {
  const allowed = ROLE_PLATFORM[role] ?? 'both';
  if (allowed === 'both' || !platform) return false;
  return platform !== allowed;
};

export const PLATFORM_LOCK_MESSAGE = 'This account cannot be used on this platform';
