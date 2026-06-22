import React from 'react';
import { FlatList, View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { Spacing, Layout } from '../../src/constants/spacing';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useNotificationList, useMarkRead, useMarkAllRead } from '../../src/hooks/useNotifications';

dayjs.extend(relativeTime);

const NOTIF_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  TASK_ASSIGNED: 'check-square',
  TASK_STATUS_CHANGED: 'refresh-cw',
  TASK_OVERDUE: 'alert-circle',
  COMMENT_ADDED: 'message-circle',
  TASK_DUE_SOON: 'clock',
  REPORT_READY: 'file-text',
};

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsScreen() {
  const { data, isLoading } = useNotificationList();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  const notifications = (data ?? []) as Notification[];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <SafeScreen>
      <ScreenHeader
        title="Notifications"
        showBack
        rightAction={
          hasUnread
            ? { icon: 'check-circle', label: 'Mark all read', onPress: () => markAllRead() }
            : undefined
        }
      />

      <FlatList
        data={isLoading ? [] : notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: Spacing[3] }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height={72} borderRadius={12} />
              ))}
            </View>
          ) : (
            <EmptyState icon="bell" title="No notifications" subtitle="You're all caught up!" />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.notifCard,
              !item.isRead && styles.unread,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              if (!item.isRead) markRead(item.id);
            }}
            accessibilityRole="button"
          >
            <View style={[styles.iconBg, !item.isRead && styles.iconBgUnread]}>
              <Feather
                name={NOTIF_ICONS[item.type] ?? 'bell'}
                size={18}
                color={!item.isRead ? Colors.brand.primary : Colors.text.tertiary}
              />
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.message, !item.isRead && styles.messageUnread]} numberOfLines={3}>
                {item.message}
              </Text>
              <Text style={styles.time}>{dayjs(item.createdAt).fromNow()}</Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[4], gap: Spacing[2], paddingBottom: Spacing[8] },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
  },
  unread: { backgroundColor: Colors.brand.primaryLight },
  pressed: { opacity: 0.8 },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgUnread: { backgroundColor: Colors.surface.card },
  notifContent: { flex: 1, gap: 4 },
  message: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary },
  messageUnread: { fontFamily: 'Inter-Medium', color: Colors.text.primary },
  time: { ...Typography.caption, fontFamily: 'Inter-Regular', color: Colors.text.tertiary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.primary,
    marginTop: 6,
  },
});
