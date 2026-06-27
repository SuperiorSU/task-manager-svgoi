import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import type { ActivityItem, ActivityType } from '../../data/dashboard.mock';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

// ─── Icon + accent color per activity type ───────────────────────────────────
const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: keyof typeof Feather.glyphMap; color: string; bg: string }
> = {
  ASSIGNED:      { icon: 'user-plus',   color: Colors.brand.primary,   bg: Colors.brand.primaryLight },
  ACCEPTED:      { icon: 'check-circle',color: Colors.semantic.success, bg: Colors.semantic.successBg },
  STATUS_CHANGED:{ icon: 'refresh-cw',  color: Colors.status.inProgress.text, bg: Colors.status.inProgress.bg },
  COMMENT_ADDED: { icon: 'message-circle', color: Colors.status.underReview.text, bg: Colors.status.underReview.bg },
  COMPLETED:     { icon: 'check-square', color: Colors.semantic.success, bg: Colors.semantic.successBg },
  SUBMITTED:     { icon: 'upload',       color: Colors.brand.primary,   bg: Colors.brand.primaryLight },
  REASSIGNED:    { icon: 'corner-up-right', color: Colors.status.accepted.text, bg: Colors.status.accepted.bg },
};

type Props = {
  item: ActivityItem;
};

export const DashboardActivityItem = React.memo(({ item }: Props) => {
  const router = useRouter();
  const config = ACTIVITY_CONFIG[item.type];

  const handlePress = useCallback(() => {
    router.push(`/(app)/tasks/${item.taskId}`);
  }, [item.taskId, router]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.actorName} ${item.description} ${item.taskTitle}`}
    >
      {/* Accent icon */}
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Feather name={config.icon} size={15} color={config.color} />
      </View>

      {/* Text block */}
      <View style={styles.body}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.actor}>{item.actorName}</Text>
          {' '}
          <Text style={styles.action}>{item.description}</Text>
          {' '}
          <Text style={styles.taskTitle}>"{item.taskTitle}"</Text>
        </Text>
        <Text style={styles.time}>{dayjs(item.createdAt).fromNow()}</Text>
      </View>

      <Feather name="chevron-right" size={14} color={Colors.text.tertiary} />
    </Pressable>
  );
});

DashboardActivityItem.displayName = 'DashboardActivityItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1 },
  text: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    lineHeight: 20,
  },
  actor: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  action: {
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  taskTitle: {
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  time: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    marginTop: 3,
  },
});
