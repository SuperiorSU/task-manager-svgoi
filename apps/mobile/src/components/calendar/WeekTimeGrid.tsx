import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import dayjs, { type Dayjs } from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { useColors } from '../../constants/colors';

const ROW_HEIGHT = 74;
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const TIME_COL_W = 34;

type Priority = CalendarTask['priority'];

// ─── Task block ───────────────────────────────────────────────────────────────

type TaskBlockProps = {
  task: CalendarTask;
  onPress?: ((task: CalendarTask) => void) | undefined;
};

const TaskBlock = React.memo(({ task, onPress }: TaskBlockProps) => {
  const colors = useColors();
  const p = task.priority;
  const pk = p.toLowerCase() as keyof typeof colors.priority;
  const time = dayjs(task.dueDate).format('H:mm');

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={[
        styles.block,
        { backgroundColor: colors.priority[pk].bg, borderLeftColor: colors.priority[pk].solid },
      ]}
    >
      <Text style={[styles.blockTitle, { color: colors.priority[pk].text }]} numberOfLines={2}>
        {task.title}
      </Text>
      <Text style={[styles.blockTime, { color: colors.priority[pk].solid }]}>{time}</Text>
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
    const colors = useColors();

    const weekDays = useMemo(
      () => Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day')),
      [weekStart],
    );

    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.surface.card }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {HOURS.map((hour) => (
          <View key={hour} style={styles.row}>
            <View style={[styles.timeCol, { borderTopColor: colors.surface.border }]}>
              <Text style={[styles.timeLabel, { color: colors.text.tertiary }]}>
                {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </Text>
            </View>

            {weekDays.map((day, di) => {
              const dateStr = day.format('YYYY-MM-DD');
              const isToday = day.isSame(today, 'day');
              const isSelected = day.isSame(selectedDate, 'day');

              const dayTasks = taskMap.get(dateStr) ?? [];
              const slotTasks = dayTasks.filter((t) => dayjs(t.dueDate).hour() === hour);

              return (
                <View
                  key={`${dateStr}-${hour}`}
                  style={[
                    styles.cell,
                    { borderTopColor: colors.surface.border, borderLeftColor: colors.surface.border },
                    di === 0 && { borderLeftColor: colors.surface.border },
                    (isToday || isSelected) && { backgroundColor: colors.brand.primaryLight },
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
  scroll: { flex: 1 },
  content: {},
  row: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
  },
  timeCol: {
    width: TIME_COL_W,
    borderTopWidth: 1,
    paddingTop: 3,
    paddingRight: 4,
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  cell: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    padding: 2,
    gap: 2,
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
