import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import dayjs, { type Dayjs } from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { Colors } from '../../constants/colors';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 64; // px per hour — matches HTML reference
const TIME_COL_W = 52;
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;
const HOUR_START = 7;
const HOUR_END = 21;

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

// ─── Task event block ─────────────────────────────────────────────────────────

type EventBlockProps = {
  task: CalendarTask;
  onPress?: ((task: CalendarTask) => void) | undefined;
};

const EventBlock = React.memo(({ task, onPress }: EventBlockProps) => {
  const p = task.priority;
  const d = dayjs(task.dueDate);
  const timeStr = d.format('h:mm A');

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [
        styles.block,
        { backgroundColor: BLOCK_BG[p], borderLeftColor: BLOCK_BORDER[p] },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.blockTitle, { color: BLOCK_TEXT[p] }]} numberOfLines={2}>
        {task.title}
      </Text>
      <Text style={[styles.blockMeta, { color: BLOCK_BORDER[p] }]}>
        {timeStr} · {task.department}
      </Text>
    </Pressable>
  );
});

EventBlock.displayName = 'EventBlock';

// ─── "Now" line ───────────────────────────────────────────────────────────────

type NowLineProps = { currentHour: number; currentMinute: number };

const NowLine = React.memo(({ currentHour, currentMinute }: NowLineProps) => {
  const offsetFromRowTop = (currentMinute / 60) * ROW_HEIGHT;
  const topOffset = (currentHour - HOUR_START) * ROW_HEIGHT + offsetFromRowTop;
  const timeStr = dayjs().format('H:mm');

  if (currentHour < HOUR_START || currentHour > HOUR_END) return null;

  return (
    <View style={[styles.nowRow, { top: topOffset }]} pointerEvents="none">
      <Text style={styles.nowTime}>{timeStr}</Text>
      <View style={styles.nowDot} />
      <View style={styles.nowLine} />
    </View>
  );
});

NowLine.displayName = 'NowLine';

// ─── DayTimeline ──────────────────────────────────────────────────────────────

type Props = {
  date: Dayjs;
  today: Dayjs;
  taskMap: Map<string, CalendarTask[]>;
  onTaskPress?: (task: CalendarTask) => void;
};

export const DayTimeline = React.memo(({ date, today, taskMap, onTaskPress }: Props) => {
  const scrollRef = useRef<ScrollView>(null);
  const now = dayjs();
  const isToday = date.isSame(today, 'day');

  const dateStr = date.format('YYYY-MM-DD');
  const dayTasks = taskMap.get(dateStr) ?? [];

  // Map tasks by hour slot
  const tasksByHour = useMemo(() => {
    const m = new Map<number, CalendarTask[]>();
    for (const t of dayTasks) {
      const h = dayjs(t.dueDate).hour();
      m.set(h, [...(m.get(h) ?? []), t]);
    }
    return m;
  }, [dayTasks]);

  // Scroll to current time (or 8 AM) on mount
  useEffect(() => {
    const scrollToHour = isToday ? Math.max(now.hour() - 2, HOUR_START) : 8;
    const y = (scrollToHour - HOUR_START) * ROW_HEIGHT;
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.grid}>
        {HOURS.map((hour) => {
          const label =
            hour < 12
              ? `${hour} AM`
              : hour === 12
              ? '12 PM'
              : `${hour - 12} PM`;

          const slotTasks = tasksByHour.get(hour) ?? [];

          return (
            <View key={hour} style={styles.hourRow}>
              {/* Time label */}
              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>{label}</Text>
              </View>

              {/* Content column */}
              <View style={styles.contentCol}>
                <View style={styles.topBorder} />
                {slotTasks.length > 0 ? (
                  <View style={styles.blocks}>
                    {slotTasks.map((task) => (
                      <EventBlock key={task.id} task={task} onPress={onTaskPress} />
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}

        {/* Now indicator overlay */}
        {isToday && (
          <NowLine currentHour={now.hour()} currentMinute={now.minute()} />
        )}
      </View>
    </ScrollView>
  );
});

DayTimeline.displayName = 'DayTimeline';

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.surface.card },
  content: { paddingBottom: 40 },
  grid: { position: 'relative' },
  hourRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
  },
  timeCol: {
    width: TIME_COL_W,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    lineHeight: 14,
  },
  contentCol: {
    flex: 1,
    position: 'relative',
  },
  topBorder: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  blocks: {
    flex: 1,
    padding: 4,
    gap: 4,
  },
  block: {
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  blockTitle: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 16,
  },
  blockMeta: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    lineHeight: 14,
  },

  // Now indicator
  nowRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowTime: {
    width: TIME_COL_W,
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
    textAlign: 'right',
    paddingRight: 6,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  nowLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#DC2626',
  },
});
