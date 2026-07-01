import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type ActivityAction =
  | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'STATUS_CHANGED' | 'ASSIGNED' | 'REASSIGNED'
  | string;

type ActivityItemShape = {
  id: string;
  action: ActivityAction;
  description: string;
  createdAt: string;
  task: { id: string; title: string };
  actor: { id: string; name: string; avatarUrl?: string | null };
};

type Props = {
  item: ActivityItemShape;
};

export const DashboardActivityItem = React.memo(({ item }: Props) => {
  const router = useRouter();
  const colors = useColors();

  const ACTION_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
    CREATE:         { icon: 'plus-circle',    color: colors.brand.primary,          bg: colors.brand.primaryLight },
    UPDATE:         { icon: 'message-circle', color: colors.status.underReview.text, bg: colors.status.underReview.bg },
    DELETE:         { icon: 'trash-2',        color: colors.semantic.error,          bg: colors.semantic.errorBg },
    STATUS_CHANGED: { icon: 'refresh-cw',     color: colors.status.inProgress.text,  bg: colors.status.inProgress.bg },
    ASSIGNED:       { icon: 'user-plus',      color: colors.brand.primary,           bg: colors.brand.primaryLight },
    REASSIGNED:     { icon: 'corner-up-right', color: colors.status.accepted.text,   bg: colors.status.accepted.bg },
  };

  const config = ACTION_CONFIG[item.action] ?? {
    icon: 'activity' as keyof typeof Feather.glyphMap,
    color: colors.text.secondary,
    bg: colors.surface.background,
  };

  const handlePress = useCallback(() => {
    router.push(`/(app)/tasks/${item.task.id}`);
  }, [item.task.id, router]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface.card },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.actor.name} ${item.description} ${item.task.title}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Feather name={config.icon} size={15} color={config.color} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.text, { color: colors.text.primary }]} numberOfLines={2}>
          <Text style={[styles.actor, { color: colors.text.primary }]}>{item.actor.name}</Text>
          {' '}
          <Text style={[styles.action, { color: colors.text.secondary }]}>{item.description}</Text>
          {' '}
          <Text style={[styles.taskTitle, { color: colors.text.primary }]}>"{item.task.title}"</Text>
        </Text>
        <Text style={[styles.time, { color: colors.text.tertiary }]}>{dayjs(item.createdAt).fromNow()}</Text>
      </View>

      <Feather name="chevron-right" size={14} color={colors.text.tertiary} />
    </Pressable>
  );
});

DashboardActivityItem.displayName = 'DashboardActivityItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
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
    lineHeight: 20,
  },
  actor: {
    fontFamily: 'Inter-SemiBold',
  },
  action: {
    fontFamily: 'Inter-Regular',
  },
  taskTitle: {
    fontFamily: 'Inter-Medium',
  },
  time: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    marginTop: 3,
  },
});
