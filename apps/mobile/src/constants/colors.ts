export const Colors = {
  brand: {
    primary: '#1A5CF8',
    primaryDark: '#1238A8',
    primaryLight: '#EFF6FF',
    secondary: '#0D2270',
  },
  surface: {
    background: '#F4F6FA',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    overlay: 'rgba(0,0,0,0.4)',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    link: '#1A5CF8',
    disabled: '#CBD5E1',
  },
  priority: {
    critical: { solid: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', text: '#5B21B6' },
    high:     { solid: '#EF4444', bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
    medium:   { solid: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
    low:      { solid: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  },
  status: {
    pending:     { solid: '#94A3B8', bg: '#F8FAFC', text: '#475569' },
    accepted:    { solid: '#60A5FA', bg: '#EFF6FF', text: '#1D4ED8' },
    inProgress:  { solid: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
    underReview: { solid: '#A78BFA', bg: '#F5F3FF', text: '#6D28D9' },
    completed:   { solid: '#22C55E', bg: '#F0FDF4', text: '#15803D' },
    cancelled:   { solid: '#94A3B8', bg: '#F8FAFC', text: '#64748B' },
    overdue:     { solid: '#DC2626', bg: '#FEF2F2', text: '#991B1B' },
  },
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    successBg: '#F0FDF4',
    warningBg: '#FFFBEB',
    errorBg: '#FEF2F2',
    infoBg: '#EFF6FF',
  },
} as const;

export type AppColors = typeof Colors;

/** Always returns the light palette — dark mode is not supported by design. */
export function useColors(): AppColors {
  return Colors;
}
