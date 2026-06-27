import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { MockTask } from '../../data/tasks.mock';
import { isTaskOverdue } from '../../data/tasks.mock';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';
import { TaskStatusBadge } from './TaskStatusBadge';
import { priorityStripeColor } from './TaskPriorityIndicator';

type Props = {
  task: MockTask;
  onMorePress?: (task: MockTask) => void;
  onPress?: (id: string) => void;
};

export const TaskCard = React.memo(({ task, onMorePress, onPress }: Props) => {
  const router = useRouter();
  const overdue = isTaskOverdue(task);
  const stripeColor = priorityStripeColor(task.priority);

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
        overdue && styles.overdueCard,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
    >
      {/* Signature 4pt priority stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.body}>
        {/* Top row: status badge + overflow */}
        <View style={styles.topRow}>
          <TaskStatusBadge status={task.status} isOverdue={overdue} />
          <Pressable
            onPress={handleMore}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.moreBtn}
            accessibilityLabel="More options"
          >
            <Feather name="more-vertical" size={18} color={Colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>

        {/* Project + Department */}
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Feather name="folder" size={10} color={Colors.brand.primary} />
            <Text style={styles.tagText} numberOfLines={1}>
              {task.project.name}
            </Text>
          </View>
          <View style={[styles.tag, styles.tagMuted]}>
            <Feather name="briefcase" size={10} color={Colors.text.tertiary} />
            <Text style={[styles.tagText, styles.tagTextMuted]} numberOfLines={1}>
              {task.department.name}
            </Text>
          </View>
        </View>

        {/* Meta: due date + assignee */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather
              name="clock"
              size={11}
              color={overdue ? Colors.semantic.error : Colors.text.tertiary}
            />
            <Text
              style={[styles.metaText, overdue && styles.overdueText]}
              numberOfLines={1}
            >
              {' '}{dueLabel}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="user" size={11} color={Colors.text.tertiary} />
            <Text style={styles.metaText} numberOfLines={1}>
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
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    minHeight: Layout.taskCardMinHeight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  overdueCard: { backgroundColor: Colors.status.overdue.bg },
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
  moreBtn: {
    padding: 4,
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
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
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagMuted: { backgroundColor: Colors.surface.background },
  tagText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Medium',
    color: Colors.brand.primary,
    maxWidth: 120,
  },
  tagTextMuted: { color: Colors.text.secondary },
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
    color: Colors.text.secondary,
  },
  overdueText: {
    color: Colors.semantic.error,
    fontFamily: 'Inter-Medium',
  },
});
