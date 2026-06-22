import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { Task } from '@godigitify/types';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';
import { TaskStatusBadge } from './TaskStatusBadge';
import { priorityStripeColor } from './TaskPriorityIndicator';

type Props = {
  task: Task & {
    assignee?: { name: string };
    department?: { name: string } | null;
  };
  onPress?: (id: string) => void;
};

const isOverdue = (task: Task) =>
  !['COMPLETED', 'CANCELLED'].includes(task.status) &&
  dayjs(task.dueDate).isBefore(dayjs());

export const TaskCard = React.memo(({ task, onPress }: Props) => {
  const router = useRouter();
  const overdue = isOverdue(task);
  const stripeColor = priorityStripeColor(task.priority);

  const handlePress = useCallback(() => {
    onPress ? onPress(task.id) : router.push(`/(app)/tasks/${task.id}`);
  }, [task.id, onPress, router]);

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
      {/* Signature priority stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <TaskStatusBadge status={task.status} isOverdue={overdue} />
          <Feather name="more-vertical" size={18} color={Colors.text.tertiary} />
        </View>

        <Text style={styles.title} numberOfLines={2}>{task.title}</Text>

        <View style={styles.metaRow}>
          {task.department && (
            <Text style={styles.meta}>{task.department.name}</Text>
          )}
          {task.department && <Text style={styles.metaDot}>·</Text>}
          <Feather name="clock" size={11} color={overdue ? Colors.semantic.error : Colors.text.tertiary} />
          <Text style={[styles.meta, overdue && styles.overdueText]}>
            {' '}{dayjs(task.dueDate).format('MMM D')}
          </Text>
          {task.assignee && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{task.assignee.name}</Text>
            </>
          )}
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
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  overdueCard: { backgroundColor: Colors.semantic.errorBg },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  stripe: { width: 4 },
  content: { flex: 1, padding: Layout.cardPadding, gap: Spacing[2] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', color: Colors.text.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3 },
  meta: { ...Typography.labelMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary },
  metaDot: { ...Typography.labelMd, color: Colors.text.tertiary },
  overdueText: { color: Colors.semantic.error },
});
