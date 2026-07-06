import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import type { DashboardAuditEvent } from '../../hooks/useSuperAdminDashboard';

type Props = {
  events: DashboardAuditEvent[];
  onSeeLogPress?: () => void;
};

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
        {events.map((event, idx) => (
          <View
            key={event.id}
            style={[
              styles.row,
              idx < events.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.surface.border },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: event.iconBg }]}>
              <Feather name={event.icon} size={16} color={event.iconColor} />
            </View>
            <View style={styles.body}>
              <Text style={[styles.eventText, { color: colors.text.primary }]}>{event.headline}</Text>
              <Text style={[styles.contextLabel, { color: colors.text.tertiary }]}>{event.contextLabel}</Text>
            </View>
          </View>
        ))}
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
  contextLabel: { fontSize: 11, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 3 },
});
