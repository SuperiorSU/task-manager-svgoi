import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs, { type Dayjs } from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { buildDayMeta, type DayMeta } from '../../hooks/useCalendar';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

// ─── Priority dot colors ──────────────────────────────────────────────────────

const DOT_COLORS: Record<CalendarTask['priority'], string> = {
  CRITICAL: Colors.priority.critical.solid,
  HIGH:     Colors.priority.high.solid,
  MEDIUM:   Colors.priority.medium.solid,
  LOW:      Colors.priority.low.solid,
};

// ─── Day cell ─────────────────────────────────────────────────────────────────

const DAY_CELL_HEIGHT = 46;

type DayCellProps = {
  meta: DayMeta;
  onPress: (date: Dayjs) => void;
};

const DayCell = React.memo(({ meta, onPress }: DayCellProps) => {
  const { date, isToday, isSelected, isWeekend, isCurrentMonth, isOverdue, dots } = meta;
  const dateNum = date.date();

  const circleStyle = isSelected || isToday
    ? [styles.circle, isSelected ? styles.circleSelected : styles.circleToday]
    : null;

  const dateTextStyle = [
    styles.dateNum,
    isSelected ? styles.dateNumSelected
      : isToday ? styles.dateNumToday
      : isOverdue ? styles.dateNumOverdue
      : isWeekend ? styles.dateNumWeekend
      : !isCurrentMonth ? styles.dateNumOff
      : undefined,
  ];

  const cellBg = isOverdue && !isSelected && !isToday
    ? styles.cellOverdue
    : undefined;

  const dotsOnSelected = isSelected || isToday;

  return (
    <Pressable
      onPress={() => onPress(date)}
      style={[styles.cell, cellBg]}
      accessibilityRole="button"
      accessibilityLabel={date.format('dddd, D MMMM YYYY')}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={circleStyle ?? styles.circleNone}>
        <Text style={dateTextStyle}>{dateNum}</Text>
      </View>

      {dots.length > 0 && (
        <View style={styles.dots}>
          {dots.map(({ priority, key }) => (
            <View
              key={key}
              style={[
                styles.dot,
                {
                  backgroundColor: dotsOnSelected
                    ? 'rgba(255,255,255,0.85)'
                    : DOT_COLORS[priority],
                },
              ]}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
});

DayCell.displayName = 'DayCell';

// ─── MonthGrid ────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  monthAnchor: Dayjs;
  today: Dayjs;
  selectedDate: Dayjs;
  taskMap: Map<string, CalendarTask[]>;
  onSelectDate: (date: Dayjs) => void;
};

export const MonthGrid = React.memo(
  ({ monthAnchor, today, selectedDate, taskMap, onSelectDate }: Props) => {
    const days = useMemo(() => {
      const firstOfMonth = monthAnchor.startOf('month');
      // Monday-based: dow 0=Sun mapped to 7
      const startDow = firstOfMonth.day() === 0 ? 7 : firstOfMonth.day();
      // Start of grid = Monday before (or on) the 1st
      const gridStart = firstOfMonth.subtract(startDow - 1, 'day');

      const cells: DayMeta[] = [];
      for (let i = 0; i < 42; i++) {
        const d = gridStart.add(i, 'day');
        cells.push(buildDayMeta(d, today, selectedDate, taskMap, monthAnchor));
      }

      // Trim last row if all off-month
      const trimmed = cells.slice(0, 35);
      const lastRowAllOff = cells.slice(35, 42).every((c) => !c.isCurrentMonth);
      return lastRowAllOff ? trimmed : cells;
    }, [monthAnchor, today, selectedDate, taskMap]);

    const weeks = useMemo(() => {
      const rows: DayMeta[][] = [];
      for (let i = 0; i < days.length; i += 7) {
        rows.push(days.slice(i, i + 7));
      }
      return rows;
    }, [days]);

    return (
      <View style={styles.grid}>
        {/* Weekday header */}
        <View style={styles.headerRow}>
          {WEEKDAY_LABELS.map((l, i) => (
            <View key={`${l}-${i}`} style={styles.headerCell}>
              <Text style={styles.headerLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Date rows */}
        {weeks.map((week, wi) => (
          <View key={`week-${wi}`} style={styles.weekRow}>
            {week.map((meta) => (
              <DayCell key={meta.dateStr} meta={meta} onPress={onSelectDate} />
            ))}
          </View>
        ))}
      </View>
    );
  },
);

MonthGrid.displayName = 'MonthGrid';

const styles = StyleSheet.create({
  grid: {
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.tertiary,
  },
  weekRow: {
    flexDirection: 'row',
    height: DAY_CELL_HEIGHT,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 9,
  },
  cellOverdue: {
    backgroundColor: '#FEF2F2',
    borderRadius: 9,
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
  dateNum: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  dateNumSelected: {
    color: Colors.text.inverse,
    fontFamily: 'Inter-Bold',
  },
  dateNumToday: {
    color: Colors.text.inverse,
    fontFamily: 'Inter-Bold',
  },
  dateNumOverdue: {
    color: '#B91C1C',
    fontFamily: 'Inter-SemiBold',
  },
  dateNumWeekend: {
    color: Colors.text.tertiary,
  },
  dateNumOff: {
    color: Colors.text.disabled,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
