import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Dayjs } from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { buildDayMeta } from '../../hooks/useCalendar';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Priority dot colors ──────────────────────────────────────────────────────

const DOT_COLORS: Record<CalendarTask['priority'], string> = {
  CRITICAL: Colors.priority.critical.solid,
  HIGH:     Colors.priority.high.solid,
  MEDIUM:   Colors.priority.medium.solid,
  LOW:      Colors.priority.low.solid,
};

// ─── WeekStrip ────────────────────────────────────────────────────────────────

type Props = {
  /** The Monday of the current week */
  weekStart: Dayjs;
  today: Dayjs;
  selectedDate: Dayjs;
  taskMap: Map<string, CalendarTask[]>;
  onSelectDate: (date: Dayjs) => void;
};

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const WeekStrip = React.memo(
  ({ weekStart, today, selectedDate, taskMap, onSelectDate }: Props) => {
    const days = useMemo(
      () =>
        Array.from({ length: 7 }).map((_, i) => {
          const d = weekStart.add(i, 'day');
          return buildDayMeta(d, today, selectedDate, taskMap);
        }),
      [weekStart, today, selectedDate, taskMap],
    );

    return (
      <View style={styles.strip}>
        {/* Spacer column matching time-label width in WeekTimeGrid */}
        <View style={styles.spacer} />
        {days.map((meta, i) => {
          const { date, isToday, isSelected, isWeekend, dots } = meta;

          const circleStyle = isSelected
            ? [styles.circle, styles.circleSelected]
            : isToday
            ? [styles.circle, styles.circleToday]
            : styles.circleNone;

          const numStyle = isSelected || isToday
            ? styles.numOnCircle
            : isWeekend
            ? styles.numWeekend
            : styles.numDefault;

          const letterStyle = isToday || isSelected
            ? styles.letterActive
            : styles.letterDefault;

          return (
            <Pressable
              key={meta.dateStr}
              onPress={() => onSelectDate(date)}
              style={styles.dayCol}
              accessibilityLabel={date.format('dddd D')}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={letterStyle}>{DAY_LETTERS[i]}</Text>
              <View style={circleStyle}>
                <Text style={numStyle}>{date.date()}</Text>
              </View>
              {dots.length > 0 && (
                <View style={styles.dots}>
                  {dots.slice(0, 3).map(({ priority, key }) => (
                    <View
                      key={key}
                      style={[styles.dot, { backgroundColor: DOT_COLORS[priority] }]}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  },
);

WeekStrip.displayName = 'WeekStrip';

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  spacer: {
    width: 34,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  letterDefault: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  letterActive: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brand.primary,
  },
  circleNone: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleToday: {
    backgroundColor: Colors.brand.primary,
  },
  circleSelected: {
    backgroundColor: Colors.brand.secondary,
  },
  numDefault: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  numWeekend: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: Colors.text.disabled,
  },
  numOnCircle: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: Colors.text.inverse,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
