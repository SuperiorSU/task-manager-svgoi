import { useColorScheme } from 'react-native';

import { useThemeStore } from '../stores/theme.store';

// ─── Light palette ────────────────────────────────────────────────────────────

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

// ─── Dark palette ─────────────────────────────────────────────────────────────

export const DarkColors = {
  brand: {
    primary: '#3B82F6',
    primaryDark: '#1238A8',
    primaryLight: '#1E3A6E',
    secondary: '#0D2270',
  },
  surface: {
    background: '#0F172A',
    card: '#1E293B',
    cardElevated: '#243248',
    border: '#334155',
    borderStrong: '#475569',
    overlay: 'rgba(0,0,0,0.6)',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0F172A',
    link: '#60A5FA',
    disabled: '#475569',
  },
  priority: {
    critical: { solid: '#A78BFA', bg: '#2E1065', border: '#6D28D9', text: '#C4B5FD' },
    high:     { solid: '#F87171', bg: '#450A0A', border: '#991B1B', text: '#FCA5A5' },
    medium:   { solid: '#FBBF24', bg: '#451A03', border: '#B45309', text: '#FDE68A' },
    low:      { solid: '#4ADE80', bg: '#052E16', border: '#166534', text: '#86EFAC' },
  },
  status: {
    pending:     { solid: '#64748B', bg: '#1E293B', text: '#94A3B8' },
    accepted:    { solid: '#60A5FA', bg: '#1E3A6E', text: '#93C5FD' },
    inProgress:  { solid: '#FBBF24', bg: '#451A03', text: '#FDE68A' },
    underReview: { solid: '#C4B5FD', bg: '#2E1065', text: '#DDD6FE' },
    completed:   { solid: '#4ADE80', bg: '#052E16', text: '#86EFAC' },
    cancelled:   { solid: '#64748B', bg: '#1E293B', text: '#94A3B8' },
    overdue:     { solid: '#F87171', bg: '#450A0A', text: '#FCA5A5' },
  },
  semantic: {
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    successBg: '#052E16',
    warningBg: '#451A03',
    errorBg: '#450A0A',
    infoBg: '#1E3A6E',
  },
} as const;

export type AppColors = typeof Colors;

// ─── Reactive hook ────────────────────────────────────────────────────────────

export function useColors(): AppColors {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);

  const isDark =
    preference === 'dark' ||
    (preference === 'system' && systemScheme === 'dark');

  // DarkColors has the same shape as Colors — safe cast
  return isDark ? (DarkColors as unknown as AppColors) : Colors;
}

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  return (
    preference === 'dark' ||
    (preference === 'system' && systemScheme === 'dark')
  );
}
