import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs, { type Dayjs } from 'dayjs';

import type { CalendarView } from '../../hooks/useCalendar';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

// ─── Title builders ───────────────────────────────────────────────────────────

const buildTitle = (view: CalendarView, periodAnchor: Dayjs): { main: string; sub?: string } => {
  if (view === 'Month') {
    return { main: periodAnchor.format('MMMM YYYY') };
  }
  if (view === 'Week') {
    const end = periodAnchor.add(6, 'day');
    if (periodAnchor.month() === end.month()) {
      return { main: `${periodAnchor.format('D')} – ${end.format('D')} ${periodAnchor.format('MMMM')}` };
    }
    return { main: `${periodAnchor.format('D MMM')} – ${end.format('D MMM')}` };
  }
  // Day view
  return {
    main: periodAnchor.format('dddd'),
    sub: `${periodAnchor.format('D MMMM YYYY')}${periodAnchor.isSame(dayjs(), 'day') ? ' · Today' : ''}`,
  };
};

// ─── View Toggle ──────────────────────────────────────────────────────────────

const VIEWS: CalendarView[] = ['Day', 'Week', 'Month'];

const ViewToggle = ({
  active,
  onChange,
}: {
  active: CalendarView;
  onChange: (v: CalendarView) => void;
}) => (
  <View style={toggle.container}>
    {VIEWS.map((v) => (
      <Pressable
        key={v}
        onPress={() => onChange(v)}
        style={[toggle.btn, active === v && toggle.btnActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === v }}
      >
        <Text style={[toggle.label, active === v && toggle.labelActive]}>{v}</Text>
      </Pressable>
    ))}
  </View>
);

const toggle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginTop: Spacing[3],
  },
  btn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: Colors.surface.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 12.5,
    fontFamily: 'Inter-Medium',
    color: Colors.text.tertiary,
  },
  labelActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
});

// ─── CalendarHeader ───────────────────────────────────────────────────────────

type Props = {
  view: CalendarView;
  periodAnchor: Dayjs;
  onPrev: () => void;
  onNext: () => void;
  onViewChange: (v: CalendarView) => void;
};

export const CalendarHeader = React.memo(
  ({ view, periodAnchor, onPrev, onNext, onViewChange }: Props) => {
    const { main, sub } = buildTitle(view, periodAnchor);

    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.main}>{main}</Text>
            {sub ? <Text style={styles.sub}>{sub}</Text> : null}
          </View>
          <View style={styles.navRow}>
            <Pressable
              onPress={onPrev}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Previous"
            >
              <Feather name="chevron-left" size={18} color={Colors.text.secondary} />
            </Pressable>
            <Pressable
              onPress={onNext}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Next"
            >
              <Feather name="chevron-right" size={18} color={Colors.text.secondary} />
            </Pressable>
          </View>
        </View>

        <ViewToggle active={view} onChange={onViewChange} />
      </View>
    );
  },
);

CalendarHeader.displayName = 'CalendarHeader';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: { gap: 2 },
  main: {
    ...Typography.h3,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  sub: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
