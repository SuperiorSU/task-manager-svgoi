import type { useColors } from '../constants/colors';

// Shared 75/50 completion-rate severity thresholds. Mirrors the private
// rateColor/rateTextColor helpers in components/dashboard/DepartmentComparisonCard.tsx
// (left as-is there — that module is out of scope for edits) so any new
// department-completion UI reads the same thresholds without re-deriving them.

export const rateColor = (rate: number, colors: ReturnType<typeof useColors>): string => {
  if (rate >= 75) return colors.semantic.success;
  if (rate >= 50) return colors.semantic.warning;
  return colors.semantic.error;
};

export const rateTextColor = (rate: number, colors: ReturnType<typeof useColors>): string => {
  if (rate >= 75) return colors.status.completed.text;
  if (rate >= 50) return colors.status.inProgress.text;
  return colors.status.overdue.text;
};
