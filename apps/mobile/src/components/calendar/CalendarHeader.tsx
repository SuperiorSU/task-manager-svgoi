import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs, { type Dayjs } from 'dayjs';

import type { CalendarView } from '../../hooks/useCalendar';
import { useColors } from '../../constants/colors';
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
}) => {
  const colors = useColors();

  return (
    <View style={[toggle.container, { backgroundColor: colors.surface.background }]}>
      {VIEWS.map((v) => (
        <Pressable
          key={v}
          onPress={() => onChange(v)}
          style={[
            toggle.btn,
            active === v && [toggle.btnActive, { backgroundColor: colors.surface.card }],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === v }}
        >
          <Text style={[
            toggle.label,
            { color: colors.text.tertiary },
            active === v && [toggle.labelActive, { color: colors.text.primary }],
          ]}>
            {v}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const toggle = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 12.5,
    fontFamily: 'Inter-Medium',
  },
  labelActive: {
    fontFamily: 'Inter-SemiBold',
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
    const colors = useColors();
    const { main, sub } = buildTitle(view, periodAnchor);

    return (
      <View style={[
        styles.container,
        { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border },
      ]}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.main, { color: colors.text.primary }]}>{main}</Text>
            {sub ? <Text style={[styles.sub, { color: colors.text.tertiary }]}>{sub}</Text> : null}
          </View>
          <View style={styles.navRow}>
            <Pressable
              onPress={onPrev}
              style={({ pressed }) => [
                styles.navBtn,
                { borderColor: colors.surface.border, backgroundColor: colors.surface.card },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Previous"
            >
              <Feather name="chevron-left" size={18} color={colors.text.secondary} />
            </Pressable>
            <Pressable
              onPress={onNext}
              style={({ pressed }) => [
                styles.navBtn,
                { borderColor: colors.surface.border, backgroundColor: colors.surface.card },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Next"
            >
              <Feather name="chevron-right" size={18} color={colors.text.secondary} />
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
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
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
  },
  sub: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
