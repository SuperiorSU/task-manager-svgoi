const AVATAR_PALETTE = [
  '#1A5CF8', '#0D9488', '#7C3AED', '#EA580C',
  '#0891B2', '#16A34A', '#BE185D', '#B45309',
];

/** Deterministic avatar background color from a user's initials. */
export const getAvatarColor = (initials: string): string =>
  AVATAR_PALETTE[initials.charCodeAt(0) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0]!;
