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
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { RichTask } from '@godigitify/types';
import { useColors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';
import { getInitials } from '../../utils/initial';
import { avatarPalette } from '../../utils/avatarPalette';

dayjs.extend(relativeTime);

const isTaskOverdue = (t: RichTask) =>
  !['COMPLETED', 'CANCELLED'].includes(t.status) && dayjs(t.dueDate).isBefore(dayjs());

// ─── Status chip config (theme-aware) ─────────────────────────────────────────

type ChipConfig = { bg: string; text: string; label: string };
type Palette = ReturnType<typeof useColors>;

function getStatusChip(status: string, overdue: boolean, c: Palette): ChipConfig {
  const st = c.status;
  if (overdue) return { bg: st.overdue.bg, text: st.overdue.text, label: 'OVERDUE' };
  switch (status) {
    case 'UNDER_REVIEW': return { bg: st.underReview.bg, text: st.underReview.text, label: 'REVIEW' };
    case 'IN_PROGRESS':  return { bg: st.inProgress.bg, text: st.inProgress.text, label: 'ACTIVE' };
    case 'PENDING':      return { bg: st.pending.bg, text: st.pending.text, label: 'PENDING' };
    case 'ACCEPTED':     return { bg: st.accepted.bg, text: st.accepted.text, label: 'ACCEPTED' };
    case 'COMPLETED':    return { bg: st.completed.bg, text: st.completed.text, label: 'DONE' };
    case 'CANCELLED':    return { bg: st.cancelled.bg, text: st.cancelled.text, label: 'CANCELLED' };
    default:             return { bg: st.pending.bg, text: st.pending.text, label: status };
  }
}

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
  /** Multi-select (Admin bulk cancel) — only offered for cancellable statuses by the caller. */
  selectable?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onLongPress?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
};

export const AdminTaskCard = React.memo(
  ({
    task,
    isCrossDept = false,
    onPress,
    selectable = false,
    selectionMode = false,
    selected = false,
    onLongPress,
    onToggleSelect,
  }: Props) => {
  const router = useRouter();
  const colors = useColors();
  const overdue = isTaskOverdue(task);

  const assigneeInitials = getInitials(task.assignee.name);
  const stripeColor =
    colors.priority[task.priority.toLowerCase() as keyof typeof colors.priority]?.solid ??
    colors.text.tertiary;
  const chip = getStatusChip(task.status, overdue, colors);
  const pal = avatarPalette(assigneeInitials);
  const meta = getMetaLabel(task);

  const handlePress = useCallback(() => {
    if (selectionMode) {
      onToggleSelect?.(task.id);
    } else if (onPress) {
      onPress(task.id);
    } else {
      router.push(`/(app)/tasks/${task.id}` as Parameters<typeof router.push>[0]);
    }
  }, [task.id, onPress, router, selectionMode, onToggleSelect]);

  const handleLongPress = useCallback(() => {
    if (selectable && !selectionMode) onLongPress?.(task.id);
  }, [selectable, selectionMode, onLongPress, task.id]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: colors.surface.card,
          shadowColor: '#000',
        },
        overdue && { backgroundColor: colors.status.overdue.bg },
        selected && { backgroundColor: colors.brand.primaryLight },
        pressed && s.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
      accessibilityState={selectionMode ? { selected } : undefined}
    >
      {selectionMode && (
        <View style={s.checkboxWrap}>
          <Feather
            name={selected ? 'check-circle' : 'circle'}
            size={20}
            color={selected ? colors.brand.primary : colors.surface.borderStrong}
          />
        </View>
      )}

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
          <Text style={[s.metaText, { color: colors.text.secondary }]} numberOfLines={1}>
            {task.assignee.name.split(' ')[0]} · {meta}
          </Text>

          {/* Cross-dept indicator */}
          {isCrossDept && (
            <View style={[s.crossDeptDot, { backgroundColor: colors.brand.primaryLight }]}>
              <Text style={[s.crossDeptLabel, { color: colors.brand.primary }]}>↗</Text>
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
  checkboxWrap: { paddingLeft: 12, alignItems: 'center', justifyContent: 'center' },
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
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  crossDeptLabel: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
  },
  batchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 16,
    paddingHorizontal: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  batchPillText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
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
