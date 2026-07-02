import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AUDIT_CATEGORY_META } from '../data/audit.mock';
import { useAuditEvent } from '../hooks/useAudit';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { AuditActorCard } from '../components/audit/AuditActorCard';
import { AuditDetailCard } from '../components/audit/AuditDetailCard';
import { AuditIntegrityCard } from '../components/audit/AuditIntegrityCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const SectionLabel = ({ label }: { label: string }) => {
  const colors = useColors();
  return <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>{label}</Text>;
};

export function AuditEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: event, isLoading } = useAuditEvent(id ?? '');

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerBtn}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Event details</Text>
      </View>

      {isLoading ? (
        <View style={styles.content}>
          <Skeleton height={78} borderRadius={14} />
          <Skeleton height={70} borderRadius={14} />
          <Skeleton height={200} borderRadius={14} />
          <Skeleton height={80} borderRadius={14} />
        </View>
      ) : !event ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon="shield-off" title="Event not found" subtitle="This audit record may have been removed from view" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing[8] }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <View style={[styles.headlineCard, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}>
            <View style={[styles.headlineIcon, { backgroundColor: event.iconBg }]}>
              <Feather name={event.icon} size={22} color={event.iconColor} />
            </View>
            <View style={styles.headlineBody}>
              <Text style={[styles.headlineTitle, { color: colors.text.primary }]} numberOfLines={2}>
                {event.headline}
              </Text>
              <View style={styles.headlineMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: AUDIT_CATEGORY_META[event.category].badgeBg }]}>
                  <Text style={[styles.categoryBadgeText, { color: AUDIT_CATEGORY_META[event.category].badgeColor }]}>
                    {AUDIT_CATEGORY_META[event.category].label}
                  </Text>
                </View>
                <Text style={[styles.eventId, { color: colors.text.tertiary }]}>Event #{event.id}</Text>
              </View>
            </View>
          </View>

          <SectionLabel label="Performed by" />
          <AuditActorCard actor={event.actor} />

          <SectionLabel label="Details" />
          <AuditDetailCard fields={event.details} />

          <AuditIntegrityCard hash={event.integrityHash} />

          <Text style={[styles.footerNote, { color: colors.text.tertiary }]}>
            This entry is immutable — it cannot be edited{'\n'}or deleted by any role (BRD §6I).
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3] + 2,
    paddingTop: Spacing[1] + 2,
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
  },
  headerBtn: { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  content: { padding: Spacing[4], gap: Spacing[3] },
  emptyWrap: { flex: 1, padding: Spacing[4], paddingTop: Spacing[8] },
  headlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3] + 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  headlineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headlineBody: { flex: 1, minWidth: 0 },
  headlineTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  headlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  categoryBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  categoryBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  eventId: { fontSize: 11.5, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: Spacing[2],
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    marginTop: Spacing[1],
  },
});
