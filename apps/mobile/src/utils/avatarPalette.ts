// Deterministic avatar color palette — same initials always resolve to the
// same background/foreground pair, without a central color registry.

const AVATAR_PALETTES = [
  { bg: '#EEF2FF', fg: '#4338CA' },
  { bg: '#FDF2F8', fg: '#9D174D' },
  { bg: '#F0FDF4', fg: '#15803D' },
  { bg: '#FFFBEB', fg: '#B45309' },
  { bg: '#F1F5F9', fg: '#475569' },
] as const;

export const avatarPalette = (initials: string) =>
  AVATAR_PALETTES[initials.charCodeAt(0) % AVATAR_PALETTES.length]!;

// Solid-color variant (single hex) — used where an avatar needs a filled
// circle with white text rather than a tinted bg/fg pair.
const SOLID_AVATAR_COLORS = [
  '#1A5CF8', '#0D9488', '#7C3AED', '#EA580C', '#64748B', '#9333EA', '#DB2777', '#16A34A',
] as const;

export const solidAvatarColor = (initials: string) =>
  SOLID_AVATAR_COLORS[initials.charCodeAt(0) % SOLID_AVATAR_COLORS.length]!;
