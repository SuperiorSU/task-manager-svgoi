import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs, { type Dayjs } from 'dayjs';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/spacing';

// ─── Bare month-grid due-date picker — adapted from the Admin Create Task
// screen's screen-local DatePickerModal (app/(app)/tasks/create.tsx), pulled
// out so it can be reused by the SA governance assign screen without
// depending on that unrelated file. Not task-data-coupled — pure date
// selection, unlike SuperAdminMonthGrid/MonthGrid which key into a
// task/entry map for dots.

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

type Props = {
  visible: boolean;
  selected: Dayjs;
  onConfirm: (date: Dayjs) => void;
  onClose: () => void;
};

export function DueDatePickerModal({ visible, selected, onConfirm, onClose }: Props) {
  const C = useColors();
  const [viewing, setViewing] = useState(() => (selected.isAfter(dayjs()) ? selected : dayjs().add(1, 'day')));
  const [draft, setDraft] = useState(viewing);
  const today = dayjs().startOf('day');

  useEffect(() => {
    if (visible) {
      const init = selected.isAfter(dayjs()) ? selected : dayjs().add(1, 'day');
      setViewing(init);
      setDraft(init);
    }
  }, [visible, selected]);

  const prevMonth = () => setViewing((v) => v.subtract(1, 'month'));
  const nextMonth = () => setViewing((v) => v.add(1, 'month'));

  const grid = buildCalendarGrid(viewing.year(), viewing.month());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: C.surface.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[s.handle, { backgroundColor: C.surface.border }]} />
          <Text style={[s.title, { color: C.text.primary }]}>Select Due Date</Text>

          <View style={s.nav}>
            <Pressable
              onPress={prevMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[s.navBtn, { borderColor: C.surface.border }]}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Feather name="chevron-left" size={18} color={C.text.primary} />
            </Pressable>
            <Text style={[s.navTitle, { color: C.text.primary }]}>
              {MONTH_NAMES[viewing.month()]} {viewing.year()}
            </Text>
            <Pressable
              onPress={nextMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[s.navBtn, { borderColor: C.surface.border }]}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Feather name="chevron-right" size={18} color={C.text.primary} />
            </Pressable>
          </View>

          <View style={s.weekRow}>
            {WEEKDAY_LABELS.map((d) => (
              <Text key={d} style={[s.weekLabel, { color: C.text.tertiary }]}>{d}</Text>
            ))}
          </View>

          {grid.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((day, ci) => {
                if (day === null) return <View key={ci} style={s.cell} />;
                const cellDate = dayjs(new Date(viewing.year(), viewing.month(), day));
                const isPast = cellDate.isBefore(today);
                const isToday = cellDate.isSame(today, 'day');
                const isSelected = cellDate.isSame(draft, 'day');
                return (
                  <Pressable
                    key={ci}
                    style={[
                      s.cell,
                      isSelected && [s.cellSelected, { backgroundColor: C.brand.primary }],
                      isToday && !isSelected && [s.cellToday, { borderColor: C.brand.primary }],
                    ]}
                    onPress={() => !isPast && setDraft(cellDate)}
                    disabled={isPast}
                    accessibilityRole="button"
                    accessibilityLabel={cellDate.format('MMMM D YYYY')}
                    accessibilityState={{ selected: isSelected, disabled: isPast }}
                  >
                    <Text
                      style={[
                        s.cellText,
                        { color: isPast ? C.text.disabled : isSelected ? '#fff' : isToday ? C.brand.primary : C.text.primary },
                        isSelected && { fontFamily: 'Inter-Bold' },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable
            onPress={() => onConfirm(draft)}
            style={[s.confirmBtn, { backgroundColor: C.brand.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Confirm date"
          >
            <Text style={s.confirmText}>Confirm — {draft.format('MMM D, YYYY')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingHorizontal: 20 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', marginBottom: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  navTitle: { ...Typography.bodyMd, fontFamily: 'Inter-SemiBold' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', ...Typography.caption, fontFamily: 'Inter-Medium' },
  row: { flexDirection: 'row', marginBottom: 2 },
  cell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  cellSelected: { borderRadius: 19 },
  cellToday: { borderWidth: 1.5, borderRadius: 19 },
  cellText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular' },
  confirmBtn: { height: 50, borderRadius: Layout.buttonRadius, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  confirmText: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: '#fff' },
});
