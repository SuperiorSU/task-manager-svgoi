import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  SectionList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { Notification, NotificationType } from '@godigitify/types';
import { useNotificationList, useMarkRead, useMarkAllRead, useUnreadCount } from '../../src/hooks/useNotifications';
import { useColors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { Spacing, Layout } from '../../src/constants/spacing';
import { Skeleton } from '../../src/components/ui/Skeleton';

dayjs.extend(relativeTime);

export type NotificationFilter = 'all' | 'unread';

export type NotificationGroup = { title: string; data: Notification[] };

// Groups newest-first notifications into the four buckets specced in
// 8_overview.md §4.9 — "Today", "Yesterday", "This week", "Earlier".
export function groupNotifications(notifications: Notification[]): NotificationGroup[] {
  const now = dayjs();
  const todayStart = now.startOf('day');
  const yesterdayStart = todayStart.subtract(1, 'day');
  const weekStart = todayStart.subtract(7, 'day');

  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  for (const n of notifications) {
    const d = dayjs(n.createdAt);
    if (d.isAfter(todayStart)) {
      today.push(n);
    } else if (d.isAfter(yesterdayStart)) {
      yesterday.push(n);
    } else if (d.isAfter(weekStart)) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  }

  const groups: NotificationGroup[] = [];
  if (today.length > 0) groups.push({ title: 'Today', data: today });
  if (yesterday.length > 0) groups.push({ title: 'Yesterday', data: yesterday });
  if (thisWeek.length > 0) groups.push({ title: 'This week', data: thisWeek });
  if (earlier.length > 0) groups.push({ title: 'Earlier', data: earlier });
  return groups;
}

// ─── Notification type config ─────────────────────────────────────────────────

type NotifConfig = {
  icon: React.ComponentProps<typeof Feather>['name'];
  iconBg: string;
  iconColor: string;
  borderColor: string;
};

function getNotifConfig(type: NotificationType, colors: ReturnType<typeof useColors>): NotifConfig {
  switch (type) {
    case 'TASK_OVERDUE':
      return {
        icon: 'alert-triangle',
        iconBg: colors.semantic.errorBg,
        iconColor: colors.semantic.error,
        borderColor: colors.semantic.error,
      };
    case 'TASK_DUE_SOON':
      return {
        icon: 'clock',
        iconBg: colors.semantic.warningBg,
        iconColor: colors.semantic.warning,
        borderColor: colors.semantic.warning,
      };
    case 'TASK_COMPLETED':
      return {
        icon: 'check-circle',
        iconBg: colors.semantic.successBg,
        iconColor: colors.semantic.success,
        borderColor: colors.semantic.success,
      };
    case 'TASK_ASSIGNED':
      return {
        icon: 'check-square',
        iconBg: colors.brand.primaryLight,
        iconColor: colors.brand.primary,
        borderColor: colors.brand.primary,
      };
    case 'TASK_REASSIGNED':
      return {
        icon: 'corner-up-left',
        iconBg: colors.brand.primaryLight,
        iconColor: colors.brand.primary,
        borderColor: colors.brand.primary,
      };
    case 'COMMENT_ADDED':
      return {
        icon: 'message-circle',
        iconBg: colors.brand.primaryLight,
        iconColor: colors.brand.primary,
        borderColor: colors.brand.primary,
      };
    case 'CLARIFICATION_REQUESTED':
      return {
        icon: 'help-circle',
        iconBg: colors.semantic.warningBg,
        iconColor: colors.semantic.warning,
        borderColor: colors.semantic.warning,
      };
    case 'CLARIFICATION_RESPONDED':
      return {
        icon: 'message-circle',
        iconBg: colors.brand.primaryLight,
        iconColor: colors.brand.primary,
        borderColor: colors.brand.primary,
      };
    case 'TASK_STATUS_CHANGED':
    default:
      return {
        icon: 'refresh-cw',
        iconBg: colors.brand.primaryLight,
        iconColor: colors.brand.primary,
        borderColor: colors.brand.primary,
      };
  }
}

// ─── Section header ───────────────────────────────────────────────────────────

const SectionLabel = React.memo(({ title }: { title: string }) => {
  const colors = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
      {title.toUpperCase()}
    </Text>
  );
});
SectionLabel.displayName = 'SectionLabel';

// ─── Swipe action ─────────────────────────────────────────────────────────────

const MarkReadAction = ({ onPress }: { onPress: () => void }) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.swipeAction, { backgroundColor: colors.brand.primary }]}
      accessibilityLabel="Mark as read"
    >
      <Feather name="check" size={18} color="#fff" />
      <Text style={styles.swipeLabel}>Read</Text>
    </Pressable>
  );
};

// ─── Notification card ────────────────────────────────────────────────────────

type CardProps = {
  notification: Notification;
  onPress: () => void;
  onMarkRead: () => void;
};

const NotificationCard = React.memo(({ notification, onPress, onMarkRead }: CardProps) => {
  const colors = useColors();
  const cfg = getNotifConfig(notification.type, colors);
  const { isRead } = notification;

  const renderRightActions = useCallback(
    () => <MarkReadAction onPress={onMarkRead} />,
    [onMarkRead]
  );

  const card = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface.card,
          borderLeftColor: !isRead ? cfg.borderColor : 'transparent',
        },
        !isRead && styles.cardUnread,
        isRead && styles.cardRead,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title} ${notification.body}`}
    >
      {/* Type icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
        <Feather name={cfg.icon} size={18} color={cfg.iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.messageText, { color: colors.text.primary }]} numberOfLines={3}>
          <Text style={[styles.messageBold, { color: isRead ? colors.text.secondary : colors.text.primary }]}>
            {notification.title}{' '}
          </Text>
          <Text style={{ color: isRead ? colors.text.tertiary : colors.text.secondary }}>
            {notification.body}
          </Text>
        </Text>
        <Text style={[styles.timeText, { color: colors.text.tertiary }]}>
          {dayjs(notification.createdAt).fromNow()}
        </Text>
      </View>

      {/* Unread dot */}
      {!isRead && (
        <View style={[styles.dot, { backgroundColor: colors.brand.primary }]} />
      )}
    </Pressable>
  );

  if (isRead) return card;

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      {card}
    </ReanimatedSwipeable>
  );
});
NotificationCard.displayName = 'NotificationCard';

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const SkeletonList = () => (
  <View style={styles.skeletonWrap}>
    {Array.from({ length: 5 }).map((_, i) => (
      <View key={i} style={styles.skeletonCard}>
        <Skeleton width={38} height={38} borderRadius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton height={13} borderRadius={6} />
          <Skeleton width="60%" height={11} borderRadius={6} />
        </View>
      </View>
    ))}
  </View>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyNotifications = ({ isFiltered }: { isFiltered: boolean }) => {
  const colors = useColors();
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconBg, { backgroundColor: colors.brand.primaryLight }]}>
        <Feather name="bell" size={32} color={colors.brand.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        {isFiltered ? 'No unread notifications' : 'All caught up!'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
        {isFiltered
          ? 'Switch to "All" to see previous notifications'
          : 'New notifications will appear here'}
      </Text>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [filter, setFilter] = useState<NotificationFilter>('all');

  const { data, isLoading, refetch, isRefetching } = useNotificationList();
  const { data: unreadCount = 0 } = useUnreadCount(); // also syncs notification.store as a side effect
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllRead();

  const notifications = data ?? [];
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
  const sections = groupNotifications(filtered);
  const hasUnread = unreadCount > 0;

  const handleMarkRead = useCallback(
    (id: string, taskId?: string) => {
      markRead(id);
      if (taskId) router.push(`/(app)/tasks/${taskId}` as never);
    },
    [markRead, router]
  );

  const handleMarkAllRead = useCallback(() => {
    if (isMarkingAll) return;
    // Error toast already shown by useMarkAllRead (useApiMutation).
    markAllRead();
  }, [isMarkingAll, markAllRead]);

  return (
    <View style={[styles.root, { backgroundColor: colors.surface.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: colors.surface.card,
            borderBottomColor: colors.surface.border,
          },
        ]}
      >
        {/* Row 1: back · title+badge · settings */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerBtn}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color={colors.text.primary} />
          </Pressable>

          <View style={styles.headerTitle}>
            <Text style={[styles.titleText, { color: colors.text.primary }]}>
              Notifications
            </Text>
            {hasUnread && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{unreadCount} new</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => router.push('/(app)/profile/notifications' as never)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.settingsBtn, { borderColor: colors.surface.border }]}
            accessibilityLabel="Notification settings"
          >
            <Feather name="settings" size={17} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Row 2: filter chips · mark all read */}
        <View style={styles.filterRow}>
          <View style={styles.chips}>
            <Pressable
              onPress={() => setFilter('all')}
              style={[
                styles.chip,
                filter === 'all'
                  ? { backgroundColor: colors.brand.primary }
                  : { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: filter === 'all' ? '#fff' : colors.text.secondary },
                ]}
              >
                All
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('unread')}
              style={[
                styles.chip,
                filter === 'unread'
                  ? { backgroundColor: colors.brand.primary }
                  : { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: filter === 'unread' ? '#fff' : colors.text.secondary },
                ]}
              >
                Unread
              </Text>
            </Pressable>
          </View>

          {hasUnread && (
            <Pressable onPress={handleMarkAllRead} disabled={isMarkingAll}>
              <Text
                style={[
                  styles.markAllText,
                  { color: isMarkingAll ? colors.text.tertiary : colors.brand.primary },
                ]}
              >
                Mark all read
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <SkeletonList />
      ) : sections.length === 0 ? (
        <EmptyNotifications isFiltered={filter === 'unread'} />
      ) : (
        <SectionList<Notification>
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => <SectionLabel title={section.title} />}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => handleMarkRead(item.id, item.taskId)}
              onMarkRead={() => markRead(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing[2] }} />}
          SectionSeparatorComponent={() => <View style={{ height: Spacing[1] }} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing[6] },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  headerRow: {
    height: Layout.headerHeight - 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  titleText: {
    ...Typography.h3,
    fontFamily: 'Inter-SemiBold',
  },
  newBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newBadgeText: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[3],
  },
  chips: { flexDirection: 'row', gap: Spacing[2] },
  chip: {
    height: 30,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
  },
  markAllText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
  },

  // Section label
  sectionLabel: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    marginLeft: 4,
  },

  // Notification card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderRadius: Layout.cardRadius,
    padding: 13,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  cardUnread: {},
  cardRead: { opacity: 0.78 },
  cardPressed: { opacity: 0.85 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, minWidth: 0, gap: 4 },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageBold: {
    fontFamily: 'Inter-SemiBold',
  },
  timeText: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Regular',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
    marginTop: 4,
  },

  // Swipe action
  swipeAction: {
    width: 72,
    borderRadius: Layout.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginLeft: 6,
  },
  swipeLabel: {
    ...Typography.captionSm,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },

  // Skeleton
  skeletonWrap: { padding: Spacing[4], gap: Spacing[3] },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#fff',
    borderRadius: Layout.cardRadius,
    padding: 13,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[3],
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  emptyTitle: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  listContent: { padding: Spacing[4] },
});
