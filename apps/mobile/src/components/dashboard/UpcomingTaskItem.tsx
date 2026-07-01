import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { TaskStatus, TaskPriority } from '@godigitify/types';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { TaskStatusBadge } from '../task/TaskStatusBadge';

type UpcomingTaskShape = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  department?: { name: string } | null;
};

type Props = {
  task: UpcomingTaskShape;
};

const isDueSoon = (dueDate: string) =>
  dayjs(dueDate).diff(dayjs(), 'hour') <= 24;

export const UpcomingTaskItem = React.memo(({ task }: Props) => {
  const router = useRouter();
  const colors = useColors();
  const stripeColor = colors.priority[task.priority.toLowerCase() as keyof typeof colors.priority].solid;
  const dueSoon = isDueSoon(task.dueDate);

  const handlePress = useCallback(() => {
    router.push(`/(app)/tasks/${task.id}`);
  }, [task.id, router]);

  const dueLabel = dayjs(task.dueDate).format('MMM D, h:mm A');

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface.card },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
    >
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
            {task.title}
          </Text>
          <TaskStatusBadge status={task.status} />
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.dept, { color: colors.text.secondary }]} numberOfLines={1}>
            {task.department?.name ?? '—'}
          </Text>
          <Text style={[styles.dot, { color: colors.text.tertiary }]}>·</Text>
          <Feather
            name="clock"
            size={11}
            color={dueSoon ? colors.semantic.error : colors.text.tertiary}
          />
          <Text
            style={[styles.due, { color: dueSoon ? colors.semantic.error : colors.text.secondary },
              dueSoon && { fontFamily: 'Inter-Medium' }]}
            numberOfLines={1}
          >
            {' '}{dueLabel}
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
  },
  dot: {
    ...Typography.caption,
  },
  due: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
  },
});
