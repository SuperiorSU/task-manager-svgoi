import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export type TaskOversightSegment = 'overview' | 'departments' | 'escalations';

type Props = {
  value: TaskOversightSegment;
  onChange: (segment: TaskOversightSegment) => void;
  escalationCount: number;
};

const SEGMENTS: { id: TaskOversightSegment; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'departments', label: 'Departments' },
  { id: 'escalations', label: 'Escalations' },
];

// Internal 3-way toggle for the SA Tasks tab (screens 57/58/60) — matches
// AdminTasksScreen's own scope-toggle precedent of owning its filter UI
// rather than reusing TaskFilterBar (different shape: fixed 3 segments, one
// carries a live badge count, not a horizontal-scroll status chip row).
export const TasksSegmentedControl = React.memo(({ value, onChange, escalationCount }: Props) => {
  const colors = useColors();

  return (
    <View style={[styles.track, { backgroundColor: colors.surface.background }]}>
      {SEGMENTS.map((segment) => {
        const active = segment.id === value;
        return (
          <Pressable
            key={segment.id}
            onPress={() => onChange(segment.id)}
            style={[styles.segment, active && { backgroundColor: colors.brand.secondary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={segment.label}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.text.inverse : colors.text.secondary },
                active && styles.labelActive,
              ]}
            >
              {segment.label}
            </Text>
            {segment.id === 'escalations' && escalationCount > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: active ? colors.text.inverse : colors.semantic.error },
                ]}
              >
                <Text style={[styles.badgeText, { color: active ? colors.brand.secondary : colors.text.inverse }]}>
                  {escalationCount}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
});

TasksSegmentedControl.displayName = 'TasksSegmentedControl';

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 11,
    padding: 3,
  },
  segment: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  label: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
  },
  labelActive: {
    fontFamily: 'Inter-SemiBold',
  },
  badge: {
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
  },
});
