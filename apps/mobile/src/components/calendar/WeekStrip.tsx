import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Dayjs } from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { buildDayMeta } from '../../hooks/useCalendar';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Props = {
  weekStart: Dayjs;
  today: Dayjs;
  selectedDate: Dayjs;
  taskMap: Map<string, CalendarTask[]>;
  onSelectDate: (date: Dayjs) => void;
};

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const WeekStrip = React.memo(
  ({ weekStart, today, selectedDate, taskMap, onSelectDate }: Props) => {
    const colors = useColors();

    const days = useMemo(
      () =>
        Array.from({ length: 7 }).map((_, i) => {
          const d = weekStart.add(i, 'day');
          return buildDayMeta(d, today, selectedDate, taskMap);
        }),
      [weekStart, today, selectedDate, taskMap],
    );

    return (
      <View style={[
        styles.strip,
        { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border },
      ]}>
        <View style={styles.spacer} />
        {days.map((meta, i) => {
          const { date, isToday, isSelected, isWeekend, dots } = meta;

          const circleColor = isSelected
            ? colors.brand.secondary
            : isToday
            ? colors.brand.primary
            : null;

          const numColor = isSelected || isToday
            ? colors.text.inverse
            : isWeekend
            ? colors.text.disabled
            : colors.text.primary;

          const numFontFamily = isSelected || isToday ? 'Inter-Bold' : 'Inter-Medium';

          const letterColor = isToday || isSelected ? colors.brand.primary : colors.text.tertiary;
          const letterFontFamily = isToday || isSelected ? 'Inter-SemiBold' : 'Inter-Regular';

          return (
            <Pressable
              key={meta.dateStr}
              onPress={() => onSelectDate(date)}
              style={styles.dayCol}
              accessibilityLabel={date.format('dddd D')}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.letter, { color: letterColor, fontFamily: letterFontFamily }]}>
                {DAY_LETTERS[i]}
              </Text>
              <View style={[
                styles.circleBase,
                circleColor
                  ? [styles.circle, { backgroundColor: circleColor }]
                  : styles.circleNone,
              ]}>
                <Text style={[styles.num, { color: numColor, fontFamily: numFontFamily }]}>
                  {date.date()}
                </Text>
              </View>
              {dots.length > 0 && (
                <View style={styles.dots}>
                  {dots.slice(0, 3).map(({ priority, key }) => (
                    <View
                      key={key}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: colors.priority[
                            priority.toLowerCase() as keyof typeof colors.priority
                          ].solid,
                        },
                      ]}
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
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  spacer: { width: 34 },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  letter: {
    fontSize: 10,
  },
  circleBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNone: {
    width: 26,
    height: 26,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  num: {
    fontSize: 13,
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
