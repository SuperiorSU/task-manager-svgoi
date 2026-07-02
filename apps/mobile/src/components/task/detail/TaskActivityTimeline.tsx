import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import type { TaskActivityEvent, TaskActivityAction } from '@godigitify/types';

import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, Layout } from '../../../constants/spacing';

type EventConfig = { icon: keyof typeof Feather.glyphMap; color: string; bg: string };

const DEFAULT_EVENT_CONFIG: EventConfig = {
  icon: 'edit-3',
  color: Colors.text.secondary,
  bg: Colors.surface.background,
};

const EVENT_CONFIG: Partial<Record<TaskActivityAction, EventConfig>> = {
  CREATE:         { icon: 'plus-circle',     color: Colors.brand.primary,           bg: Colors.brand.primaryLight },
  STATUS_CHANGED: { icon: 'refresh-cw',      color: Colors.status.inProgress.text,  bg: Colors.status.inProgress.bg },
  ASSIGNED:       { icon: 'user-plus',       color: Colors.brand.primary,           bg: Colors.brand.primaryLight },
  REASSIGNED:     { icon: 'corner-up-right', color: Colors.status.accepted.text,    bg: Colors.status.accepted.bg },
};

const PREVIEW_COUNT = 4;

type Props = {
  events: TaskActivityEvent[];
};

export const TaskActivityTimeline = React.memo(({ events }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? events : events.slice(0, PREVIEW_COUNT);

  if (events.length === 0) return null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="activity" size={16} color={Colors.brand.primary} />
          <Text style={styles.title}>Activity</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{events.length}</Text>
          </View>
        </View>
        {events.length > PREVIEW_COUNT && (
          <Pressable
            onPress={() => setShowAll((s) => !s)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.toggleText}>
              {showAll ? 'Show less' : `+${events.length - PREVIEW_COUNT} more`}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {displayed.map((event, idx) => {
          const config = EVENT_CONFIG[event.action] ?? DEFAULT_EVENT_CONFIG;
          const isLast = idx === displayed.length - 1;
          return (
            <View key={event.id} style={styles.row}>
              {/* Vertical line + icon */}
              <View style={styles.lineCol}>
                <View style={[styles.dot, { backgroundColor: config.bg }]}>
                  <Feather name={config.icon} size={12} color={config.color} />
                </View>
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Content */}
              <View style={[styles.content, isLast && styles.contentLast]}>
                <Text style={styles.actorName}>{event.actor.name}</Text>
                <Text style={styles.description}>{event.description}</Text>
                {event.metadata?.from && event.metadata?.to && (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaChip, styles.metaFrom]}>{event.metadata.from}</Text>
                    <Feather name="arrow-right" size={10} color={Colors.text.tertiary} />
                    <Text style={[styles.metaChip, styles.metaTo]}>{event.metadata.to}</Text>
                  </View>
                )}
                <Text style={styles.time}>{dayjs(event.createdAt).fromNow()}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

TaskActivityTimeline.displayName = 'TaskActivityTimeline';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    color: Colors.brand.primary,
  },
  toggleText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.brand.primary,
  },

  // Timeline
  timeline: { gap: 0 },
  row: { flexDirection: 'row', gap: Spacing[3] },
  lineCol: { alignItems: 'center', width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: Colors.surface.border,
    marginVertical: 2,
    minHeight: 12,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing[4],
    gap: 2,
  },
  contentLast: { paddingBottom: 0 },
  actorName: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  description: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaChip: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Medium',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaFrom: {
    backgroundColor: Colors.surface.background,
    color: Colors.text.secondary,
  },
  metaTo: {
    backgroundColor: Colors.brand.primaryLight,
    color: Colors.brand.primary,
  },
  time: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});
