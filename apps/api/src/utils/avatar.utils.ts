import { signGetUrl } from '../config/storage.js';

// Signed GET URLs can live up to 7 days (SigV4 cap). We use 6 so a client that
// cached one still has slack before it 403s — profile/user queries refetch on
// their staleTime and mint a fresh URL well before then.
const AVATAR_URL_TTL = 6 * 24 * 60 * 60;

/** Turn a stored avatar key into a short-lived signed URL (or null). */
export const signAvatarUrl = (avatarKey?: string | null): Promise<string | null> =>
  avatarKey ? signGetUrl(avatarKey, AVATAR_URL_TTL) : Promise.resolve(null);

/**
 * Replace a serialized user's `avatarUrl` with a freshly signed URL derived from
 * its private `avatarKey`, and drop `avatarKey` from the payload. Use at every
 * seam that returns the caller's own profile so the client receives a
 * renderable, expiring URL instead of a raw (unusable) storage key.
 */
export const presentUserAvatar = async <T extends Record<string, unknown>>(
  user: T
): Promise<Omit<T, 'avatarKey'>> => {
  const { avatarKey, ...rest } = user;
  const signed = await signAvatarUrl(avatarKey as string | null | undefined);
  return { ...rest, avatarUrl: signed } as unknown as Omit<T, 'avatarKey'>;
};
