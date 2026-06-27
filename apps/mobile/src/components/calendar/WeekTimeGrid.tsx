import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import dayjs, { type Dayjs } from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 74; // px per hour — matches HTML reference
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const TIME_COL_W = 34;

// ─── Priority colours ─────────────────────────────────────────────────────────

type Priority = CalendarTask['priority'];

const BLOCK_BG: Record<Priority, string> = {
  CRITICAL: Colors.priority.critical.bg,
  HIGH:     Colors.priority.high.bg,
  MEDIUM:   Colors.priority.medium.bg,
  LOW:      Colors.priority.low.bg,
};

const BLOCK_BORDER: Record<Priority, string> = {
  CRITICAL: Colors.priority.critical.solid,
  HIGH:     Colors.priority.high.solid,
  MEDIUM:   Colors.priority.medium.solid,
  LOW:      Colors.priority.low.solid,
};

const BLOCK_TEXT: Record<Priority, string> = {
  CRITICAL: Colors.priority.critical.text,
  HIGH:     Colors.priority.high.text,
  MEDIUM:   Colors.priority.medium.text,
  LOW:      Colors.priority.low.text,
};

// ─── Task block (single cell) ─────────────────────────────────────────────────

type TaskBlockProps = {
  task: CalendarTask;
  onPress?: ((task: CalendarTask) => void) | undefined;
};

const TaskBlock = React.memo(({ task, onPress }: TaskBlockProps) => {
  const p = task.priority;
  const time = dayjs(task.dueDate).format('H:mm');
  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={[
        styles.block,
        { backgroundColor: BLOCK_BG[p], borderLeftColor: BLOCK_BORDER[p] },
      ]}
    >
      <Text style={[styles.blockTitle, { color: BLOCK_TEXT[p] }]} numberOfLines={2}>
        {task.title}
      </Text>
      <Text style={[styles.blockTime, { color: BLOCK_BORDER[p] }]}>{time}</Text>
    </Pressable>
  );
});

TaskBlock.displayName = 'TaskBlock';

// ─── WeekTimeGrid ─────────────────────────────────────────────────────────────

type Props = {
  weekStart: Dayjs;
  today: Dayjs;
  selectedDate: Dayjs;
  taskMap: Map<string, CalendarTask[]>;
  onSelectDate: (date: Dayjs) => void;
  onTaskPress?: (task: CalendarTask) => void;
};

export const WeekTimeGrid = React.memo(
  ({ weekStart, today, selectedDate, taskMap, onTaskPress }: Props) => {
    const weekDays = useMemo(
      () => Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day')),
      [weekStart],
    );

    return (
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {HOURS.map((hour) => (
          <View key={hour} style={styles.row}>
            {/* Time label */}
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>
                {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </Text>
            </View>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const dateStr = day.format('YYYY-MM-DD');
              const isToday = day.isSame(today, 'day');
              const isSelected = day.isSame(selectedDate, 'day');

              // Tasks that fall in this hour slot
              const dayTasks = taskMap.get(dateStr) ?? [];
              const slotTasks = dayTasks.filter((t) => dayjs(t.dueDate).hour() === hour);

              return (
                <View
                  key={`${dateStr}-${hour}`}
                  style={[
                    styles.cell,
                    di === 0 && styles.cellFirst,
                    (isToday || isSelected) && styles.cellHighlight,
                  ]}
                >
                  {slotTasks.map((task) => (
                    <TaskBlock key={task.id} task={task} onPress={onTaskPress} />
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  },
);

WeekTimeGrid.displayName = 'WeekTimeGrid';

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.surface.card },
  content: {},
  row: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
  },
  timeCol: {
    width: TIME_COL_W,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 3,
    paddingRight: 4,
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  cell: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderLeftWidth: 1,
    borderLeftColor: '#F8FAFC',
    padding: 2,
    gap: 2,
  },
  cellFirst: {
    borderLeftColor: '#F1F5F9',
  },
  cellHighlight: {
    backgroundColor: '#FAFCFF',
    borderLeftColor: '#EFF6FF',
  },
  block: {
    borderRadius: 4,
    borderLeftWidth: 3,
    padding: 3,
    overflow: 'hidden',
    flex: 1,
    minHeight: 32,
  },
  blockTitle: {
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 11,
  },
  blockTime: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
});
