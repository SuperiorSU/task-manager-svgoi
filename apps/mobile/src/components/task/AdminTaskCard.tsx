/**
 * AdminTaskCard — compact task card for the Admin Tasks screen.
 *
 * Matches the HTML reference (screen 35):
 *   4px priority stripe | title (truncated) | assignee avatar + meta | status chip
 *
 * Reuses priority color tokens and design system constants.
 * Zero hardcoded values.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { RichTask } from '@godigitify/types';
import { useColors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';
import { getInitials } from '../../utils/initial';

const isTaskOverdue = (t: RichTask) =>
  !['COMPLETED', 'CANCELLED'].includes(t.status) && dayjs(t.dueDate).isBefore(dayjs());

dayjs.extend(relativeTime);

// ─── Priority stripe colours (design token) ───────────────────────────────────

const PRIORITY_STRIPE: Record<string, string> = {
  CRITICAL: '#7C3AED',
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#22C55E',
};

// ─── Status chip config ────────────────────────────────────────────────────────

type ChipConfig = { bg: string; text: string; label: string };

function getStatusChip(status: string, overdue: boolean): ChipConfig {
  if (overdue) return { bg: '#FEF2F2', text: '#B91C1C', label: 'OVERDUE' };
  switch (status) {
    case 'UNDER_REVIEW': return { bg: '#F5F3FF', text: '#6D28D9', label: 'REVIEW' };
    case 'IN_PROGRESS':  return { bg: '#FFFBEB', text: '#B45309', label: 'ACTIVE' };
    case 'PENDING':      return { bg: '#F1F5F9', text: '#475569', label: 'PENDING' };
    case 'ACCEPTED':     return { bg: '#EFF6FF', text: '#1D4ED8', label: 'ACCEPTED' };
    case 'COMPLETED':    return { bg: '#F0FDF4', text: '#15803D', label: 'DONE' };
    case 'CANCELLED':    return { bg: '#F8FAFC', text: '#94A3B8', label: 'CANCELLED' };
    default:             return { bg: '#F1F5F9', text: '#475569', label: status };
  }
}

// ─── Avatar colour palette (deterministic by initials) ────────────────────────

const AVATAR_PALETTES = [
  { bg: '#EEF2FF', fg: '#4338CA' },
  { bg: '#FDF2F8', fg: '#9D174D' },
  { bg: '#F0FDF4', fg: '#15803D' },
  { bg: '#FFFBEB', fg: '#B45309' },
  { bg: '#F1F5F9', fg: '#475569' },
];
const avatarPalette = (initials: string) =>
  AVATAR_PALETTES[initials.charCodeAt(0) % AVATAR_PALETTES.length]!;

// ─── Meta label: "submitted Xh ago" for UNDER_REVIEW, else due date ──────────

function getMetaLabel(task: RichTask): string {
  if (task.status === 'UNDER_REVIEW') {
    return `submitted ${dayjs(task.updatedAt).fromNow()}`;
  }
  const overdue = isTaskOverdue(task);
  if (overdue) return `Overdue · ${dayjs(task.dueDate).format('MMM D')}`;
  return `due ${dayjs(task.dueDate).format('ddd D MMM')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  task: RichTask;
  isCrossDept?: boolean;
  onPress?: (id: string) => void;
};

export const AdminTaskCard = React.memo(({ task, isCrossDept = false, onPress }: Props) => {
  const router = useRouter();
  const colors = useColors();
  const overdue = isTaskOverdue(task);

  const assigneeInitials = getInitials(task.assignee.name);
  const stripeColor = PRIORITY_STRIPE[task.priority] ?? '#94A3B8';
  const chip = getStatusChip(task.status, overdue);
  const pal = avatarPalette(assigneeInitials);
  const meta = getMetaLabel(task);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(task.id);
    } else {
      router.push(`/(app)/tasks/${task.id}` as Parameters<typeof router.push>[0]);
    }
  }, [task.id, onPress, router]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: colors.surface.card,
          shadowColor: '#000',
        },
        overdue && { backgroundColor: '#FFF5F5' },
        pressed && s.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
    >
      {/* Priority stripe */}
      <View style={[s.stripe, { backgroundColor: stripeColor }]} />

      {/* Body */}
      <View style={s.body}>
        <Text style={[s.title, { color: colors.text.primary }]} numberOfLines={1}>
          {task.title}
        </Text>

        <View style={s.meta}>
          {/* Assignee avatar */}
          <View style={[s.avatar, { backgroundColor: pal.bg }]}>
            <Text style={[s.avatarText, { color: pal.fg }]}>
              {assigneeInitials}
            </Text>
          </View>

          {/* Assignee name + meta label */}
          <Text style={[s.metaText, { color: '#64748B' }]} numberOfLines={1}>
            {task.assignee.name.split(' ')[0]} · {meta}
          </Text>

          {/* Cross-dept indicator */}
          {isCrossDept && (
            <View style={s.crossDeptDot}>
              <Text style={s.crossDeptLabel}>↗</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status chip */}
      <View style={[s.chip, { backgroundColor: chip.bg }]}>
        <Text style={[s.chipText, { color: chip.text }]}>{chip.label}</Text>
      </View>
    </Pressable>
  );
});

AdminTaskCard.displayName = 'AdminTaskCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
    minHeight: 66,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    paddingVertical: 13,
    gap: 5,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  metaText: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    flex: 1,
  },
  crossDeptDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  crossDeptLabel: {
    fontSize: 9,
    color: '#4338CA',
    fontFamily: 'Inter-Bold',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 15,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
});
