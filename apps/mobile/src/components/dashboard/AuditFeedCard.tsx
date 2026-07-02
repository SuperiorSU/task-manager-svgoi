import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import type { AuditEvent, AuditEventCategory } from '../../data/superAdminDashboard.mock';

dayjs.extend(relativeTime);

type Props = {
  events: AuditEvent[];
  onSeeLogPress?: () => void;
};

const CATEGORY_ICON: Record<AuditEventCategory, { icon: keyof typeof Feather.glyphMap; bg: string; color: string }> = {
  USER_CREATED: { icon: 'user-plus', bg: '#EEF2FF', color: '#4F46E5' },
  USER_SUSPENDED: { icon: 'x-circle', bg: '#FEF2F2', color: '#DC2626' },
  DEPARTMENT_CREATED: { icon: 'briefcase', bg: '#EEF2FF', color: '#4F46E5' },
  SYSTEM: { icon: 'refresh-cw', bg: '#F0FDF4', color: '#15803D' },
};

function BoldSegments({ text, ranges, color }: { text: string; ranges: [number, number][]; color: string }) {
  if (ranges.length === 0) {
    return <Text style={[styles.eventText, { color }]}>{text}</Text>;
  }

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach(([start, end], idx) => {
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <Text key={idx} style={styles.eventBold}>
        {text.slice(start, end)}
      </Text>
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <Text style={[styles.eventText, { color }]}>{nodes}</Text>;
}

export const AuditFeedCard = React.memo(({ events, onSeeLogPress }: Props) => {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Recent audit events</Text>
          <View style={styles.immutableBadge}>
            <Feather name="lock" size={10} color="#6D28D9" />
            <Text style={styles.immutableText}>Immutable</Text>
          </View>
        </View>
        {onSeeLogPress ? (
          <Pressable onPress={onSeeLogPress} hitSlop={8}>
            <Text style={[styles.link, { color: colors.brand.primary }]}>See log</Text>
          </Pressable>
        ) : (
          <Text style={[styles.link, { color: colors.text.tertiary }]}>See log</Text>
        )}
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
      >
        {events.map((event, idx) => {
          const meta = CATEGORY_ICON[event.category];
          return (
            <View
              key={event.id}
              style={[
                styles.row,
                idx < events.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.surface.border },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                <Feather name={meta.icon} size={16} color={meta.color} />
              </View>
              <View style={styles.body}>
                <BoldSegments text={event.description} ranges={event.boldRanges} color={colors.text.primary} />
                <Text style={[styles.contextLabel, { color: colors.text.tertiary }]}>{event.contextLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

AuditFeedCard.displayName = 'AuditFeedCard';

const styles = StyleSheet.create({
  section: { gap: Spacing[3] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  immutableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  immutableText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    color: '#6D28D9',
    textTransform: 'uppercase',
  },
  link: { fontSize: 12, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, padding: Spacing[3] + 3 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  eventText: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  eventBold: { fontFamily: 'Inter-SemiBold' },
  contextLabel: { fontSize: 11, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 3 },
});
