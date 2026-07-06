import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { GovernanceTask } from '@godigitify/types';

import { useColors } from '../../constants/colors';
import { getInitials } from '../../utils/initial';
import { TaskStatusBadge } from '../task/TaskStatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────
// Full-detail card for the SA's own governance tasks — FR-72's one exception
// to aggregate-only rollups (a creator's view of their own tasks). Always a
// navy stripe/avatar regardless of assignee, matching the HTML's "this is a
// task you're tracking" signature. Used in Month/Agenda/Day-breakdown.

type Props = {
  task: GovernanceTask;
  subtitle: string;
  /** Fixed "YOURS" pill (month view) instead of the live status badge */
  showYoursBadge?: boolean;
  onPress?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const GovernanceCalendarCard = React.memo(({ task, subtitle, showYoursBadge, onPress }: Props) => {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface.card },
        pressed && onPress && { opacity: 0.85 },
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${task.title}, ${subtitle}`}
    >
      <View style={[styles.stripe, { backgroundColor: colors.brand.secondary }]} />
      <View style={styles.inner}>
        <View style={[styles.avatar, { backgroundColor: colors.brand.secondary }]}>
          <Text style={styles.initials}>{getInitials(task.assignee.name)}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
            {task.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {showYoursBadge ? (
          <View style={[styles.yoursBadge, { backgroundColor: colors.brand.primaryLight }]}>
            <Text style={[styles.yoursText, { color: colors.brand.secondary }]}>YOURS</Text>
          </View>
        ) : (
          <TaskStatusBadge status={task.status} />
        )}
      </View>
    </Pressable>
  );
});

GovernanceCalendarCard.displayName = 'GovernanceCalendarCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  stripe: {
    width: 4,
    flexShrink: 0,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 14,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  yoursBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    flexShrink: 0,
  },
  yoursText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
});
