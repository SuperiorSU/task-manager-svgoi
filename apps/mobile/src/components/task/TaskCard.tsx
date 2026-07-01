import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { TaskStatus, TaskPriority } from '@godigitify/types';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';
import { TaskStatusBadge } from './TaskStatusBadge';

/** Minimal shape TaskCard needs — satisfied by both RichTask and MockTask */
export type TaskCardItem = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  department?: { name: string } | null;
  assignee: { name: string };
};

const isTaskOverdue = (task: TaskCardItem): boolean =>
  !['COMPLETED', 'CANCELLED'].includes(task.status) &&
  dayjs(task.dueDate).isBefore(dayjs());

type Props = {
  task: TaskCardItem;
  onMorePress?: (task: TaskCardItem) => void;
  onPress?: (id: string) => void;
};

export const TaskCard = React.memo(({ task, onMorePress, onPress }: Props) => {
  const router = useRouter();
  const colors = useColors();
  const overdue = isTaskOverdue(task);
  const stripeColor = colors.priority[task.priority.toLowerCase() as keyof typeof colors.priority].solid;

  const handlePress = useCallback(() => {
    onPress ? onPress(task.id) : router.push(`/(app)/tasks/${task.id}`);
  }, [task.id, onPress, router]);

  const handleMore = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onMorePress?.(task);
    },
    [task, onMorePress]
  );

  const dueLabel = overdue
    ? `Overdue · ${dayjs(task.dueDate).format('MMM D')}`
    : dayjs(task.dueDate).format('MMM D, h:mm A');

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: overdue ? colors.status.overdue.bg : colors.surface.card },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
    >
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <TaskStatusBadge status={task.status} isOverdue={overdue} />
          <Pressable
            onPress={handleMore}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.moreBtn}
            accessibilityLabel="More options"
          >
            <Feather name="more-vertical" size={18} color={colors.text.tertiary} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
          {task.title}
        </Text>

        <View style={styles.tagRow}>
          {task.department?.name ? (
            <View style={[styles.tag, { backgroundColor: colors.brand.primaryLight }]}>
              <Feather name="briefcase" size={10} color={colors.brand.primary} />
              <Text style={[styles.tagText, { color: colors.brand.primary }]} numberOfLines={1}>
                {task.department.name}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather
              name="clock"
              size={11}
              color={overdue ? colors.semantic.error : colors.text.tertiary}
            />
            <Text
              style={[
                styles.metaText,
                { color: overdue ? colors.semantic.error : colors.text.secondary },
                overdue && { fontFamily: 'Inter-Medium' },
              ]}
              numberOfLines={1}
            >
              {' '}{dueLabel}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="user" size={11} color={colors.text.tertiary} />
            <Text style={[styles.metaText, { color: colors.text.secondary }]} numberOfLines={1}>
              {' '}{task.assignee.name.split(' ')[0]}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

TaskCard.displayName = 'TaskCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Layout.cardRadius,
    minHeight: Layout.taskCardMinHeight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  stripe: { width: 4, flexShrink: 0 },
  body: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreBtn: { padding: 4 },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Medium',
    maxWidth: 120,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
  },
});
