import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { UpcomingTask } from '../../data/dashboard.mock';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { TaskStatusBadge } from '../task/TaskStatusBadge';
import { priorityStripeColor } from '../task/TaskPriorityIndicator';

type Props = {
  task: UpcomingTask;
};

const isDueSoon = (dueDate: string) =>
  dayjs(dueDate).diff(dayjs(), 'hour') <= 24;

export const UpcomingTaskItem = React.memo(({ task }: Props) => {
  const router = useRouter();
  const stripeColor = priorityStripeColor(task.priority);
  const dueSoon = isDueSoon(task.dueDate);

  const handlePress = useCallback(() => {
    router.push(`/(app)/tasks/${task.id}`);
  }, [task.id, router]);

  const dueLabel = dayjs(task.dueDate).format('MMM D, h:mm A');

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
    >
      {/* Signature 4pt priority stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {task.title}
          </Text>
          <TaskStatusBadge status={task.status} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.dept} numberOfLines={1}>
            {task.department}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Feather
            name="clock"
            size={11}
            color={dueSoon ? Colors.semantic.error : Colors.text.tertiary}
          />
          <Text
            style={[styles.due, dueSoon && styles.dueSoonText]}
            numberOfLines={1}
          >
            {' '}
            {dueLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

UpcomingTaskItem.displayName = 'UpcomingTaskItem';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  stripe: { width: 4 },
  body: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[1],
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  title: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  dept: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  dot: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  due: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  dueSoonText: {
    color: Colors.semantic.error,
    fontFamily: 'Inter-Medium',
  },
});
