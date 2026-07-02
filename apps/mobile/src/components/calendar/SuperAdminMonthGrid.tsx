import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Dayjs } from 'dayjs';

import { buildSaDayMeta, type SaDayMeta } from '../../hooks/useSuperAdminCalendar';
import type { CalendarDayEntry } from '../../services/superAdminCalendar.service';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Day cell ─────────────────────────────────────────────────────────────────
// Parallel to MonthGrid's DayCell, but dots resolve department color (org-unit
// identity) or navy (SA's own governance tasks) instead of task priority.

const DAY_CELL_HEIGHT = 46;

type DayCellProps = {
  meta: SaDayMeta;
  onPress: (date: Dayjs) => void;
};

const DayCell = React.memo(({ meta, onPress }: DayCellProps) => {
  const colors = useColors();
  const { date, isToday, isSelected, isWeekend, isCurrentMonth, dots } = meta;
  const dateNum = date.date();
  const dotsOnSelected = isSelected || isToday;

  const circleColor = isSelected
    ? colors.brand.secondary
    : isToday
    ? colors.brand.primary
    : null;

  const dateColor = dotsOnSelected
    ? colors.text.inverse
    : isWeekend
    ? colors.text.tertiary
    : !isCurrentMonth
    ? colors.text.disabled
    : colors.text.primary;

  const dateFontFamily = dotsOnSelected ? 'Inter-Bold' : 'Inter-Medium';

  return (
    <Pressable
      onPress={() => onPress(date)}
      style={styles.cell}
      accessibilityRole="button"
      accessibilityLabel={date.format('dddd, D MMMM YYYY')}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={[
        styles.circleBase,
        circleColor ? [styles.circle, { backgroundColor: circleColor }] : styles.circleNone,
      ]}>
        <Text style={[styles.dateNum, { color: dateColor, fontFamily: dateFontFamily }]}>
          {dateNum}
        </Text>
      </View>

      {dots.length > 0 && (
        <View style={styles.dots}>
          {dots.map((dot) => (
            <View
              key={dot.key}
              style={[
                styles.dot,
                {
                  backgroundColor: dotsOnSelected
                    ? 'rgba(255,255,255,0.85)'
                    : dot.kind === 'dept'
                    ? dot.color
                    : colors.brand.secondary,
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

// ─── SuperAdminMonthGrid ────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  monthAnchor: Dayjs;
  today: Dayjs;
  selectedDate: Dayjs;
  entryMap: Map<string, CalendarDayEntry[]>;
  onSelectDate: (date: Dayjs) => void;
};

export const SuperAdminMonthGrid = React.memo(
  ({ monthAnchor, today, selectedDate, entryMap, onSelectDate }: Props) => {
    const colors = useColors();

    const days = useMemo(() => {
      const firstOfMonth = monthAnchor.startOf('month');
      const startDow = firstOfMonth.day() === 0 ? 7 : firstOfMonth.day();
      const gridStart = firstOfMonth.subtract(startDow - 1, 'day');

      const cells: SaDayMeta[] = [];
      for (let i = 0; i < 42; i++) {
        const dt = gridStart.add(i, 'day');
        cells.push(buildSaDayMeta(dt, today, selectedDate, entryMap, monthAnchor));
      }

      const trimmed = cells.slice(0, 35);
      const lastRowAllOff = cells.slice(35, 42).every((c) => !c.isCurrentMonth);
      return lastRowAllOff ? trimmed : cells;
    }, [monthAnchor, today, selectedDate, entryMap]);

    const weeks = useMemo(() => {
      const rows: SaDayMeta[][] = [];
      for (let i = 0; i < days.length; i += 7) {
        rows.push(days.slice(i, i + 7));
      }
      return rows;
    }, [days]);

    return (
      <View style={[styles.grid, { backgroundColor: colors.surface.card }]}>
        <View style={styles.headerRow}>
          {WEEKDAY_LABELS.map((l, i) => (
            <View key={`${l}-${i}`} style={styles.headerCell}>
              <Text style={[styles.headerLabel, { color: colors.text.tertiary }]}>{l}</Text>
            </View>
          ))}
        </View>

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

SuperAdminMonthGrid.displayName = 'SuperAdminMonthGrid';

const styles = StyleSheet.create({
  grid: {
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
  dateNum: {
    fontSize: 13,
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
