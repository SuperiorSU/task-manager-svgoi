import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { AuditLogEntry } from '@godigitify/types';

import { AUDIT_CATEGORY_META, detailFieldsFor, presentAuditEntry } from '../utils/auditPresentation';
import { useVerifyAuditEntry } from '../hooks/useAudit';
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

// There is no `GET /audit/:id` on the backend (only the list endpoint,
// `/:id/verify`, and `/actor/:actorId`) — so the row the user tapped is
// carried over via navigation params (serialized on the list screen) rather
// than re-fetched here. If the screen is ever opened without that param
// (e.g. a future deep link), it degrades to an empty state.
export function AuditEventDetailScreen() {
  const { id, entry: entryParam } = useLocalSearchParams<{ id: string; entry?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; brokenAtId?: string } | null>(null);

  const event: AuditLogEntry | undefined = useMemo(() => {
    if (!entryParam) return undefined;
    try {
      return JSON.parse(entryParam) as AuditLogEntry;
    } catch {
      return undefined;
    }
  }, [entryParam]);

  const verifyMutation = useVerifyAuditEntry();

  const handleVerify = () => {
    if (!id) return;
    verifyMutation.mutate(id, { onSuccess: (res) => setVerifyResult(res.data) });
  };

  const presentation = event ? presentAuditEntry(event) : null;
  const fields = event ? detailFieldsFor(event) : [];
  const actor = event?.actor ?? { id: 'system', name: 'System', role: 'SYSTEM' };

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

      {!event || !presentation ? (
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
            <View style={[styles.headlineIcon, { backgroundColor: presentation.iconBg }]}>
              <Feather name={presentation.icon} size={22} color={presentation.iconColor} />
            </View>
            <View style={styles.headlineBody}>
              <Text style={[styles.headlineTitle, { color: colors.text.primary }]} numberOfLines={2}>
                {presentation.headline}
              </Text>
              <Text style={[styles.headlineDescription, { color: colors.text.secondary }]} numberOfLines={3}>
                {event.description}
              </Text>
              <View style={styles.headlineMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: AUDIT_CATEGORY_META[presentation.category].badgeBg }]}>
                  <Text style={[styles.categoryBadgeText, { color: AUDIT_CATEGORY_META[presentation.category].badgeColor }]}>
                    {AUDIT_CATEGORY_META[presentation.category].label}
                  </Text>
                </View>
                <Text style={[styles.eventId, { color: colors.text.tertiary }]} numberOfLines={1}>
                  Event #{event.id}
                </Text>
              </View>
            </View>
          </View>

          <SectionLabel label="Performed by" />
          <AuditActorCard actor={actor} />

          <SectionLabel label="Details" />
          <AuditDetailCard fields={fields} />

          {event.integrityHash && (
            <>
              <AuditIntegrityCard hash={event.integrityHash} />
              <Pressable
                onPress={handleVerify}
                disabled={verifyMutation.isPending}
                style={[styles.verifyBtn, { borderColor: colors.surface.border, backgroundColor: colors.surface.card }]}
                accessibilityRole="button"
              >
                <Feather name="check-circle" size={15} color={colors.text.secondary} />
                <Text style={[styles.verifyBtnText, { color: colors.text.secondary }]}>
                  {verifyMutation.isPending ? 'Verifying…' : 'Verify integrity'}
                </Text>
              </Pressable>

              {verifyResult && (
                <View
                  style={[
                    styles.verifyResult,
                    {
                      backgroundColor: verifyResult.valid ? '#F0FDF4' : '#FEF2F2',
                      borderColor: verifyResult.valid ? '#BBF7D0' : '#FECACA',
                    },
                  ]}
                >
                  <Feather
                    name={verifyResult.valid ? 'shield' : 'alert-triangle'}
                    size={15}
                    color={verifyResult.valid ? '#15803D' : '#B91C1C'}
                  />
                  <Text style={[styles.verifyResultText, { color: verifyResult.valid ? '#15803D' : '#B91C1C' }]}>
                    {verifyResult.valid
                      ? 'Chain intact — no tampering detected'
                      : `Integrity broken at record ${verifyResult.brokenAtId ?? 'unknown'}`}
                  </Text>
                </View>
              )}
            </>
          )}

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
  headlineDescription: { fontSize: 12.5, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 2 },
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
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
  },
  verifyBtnText: { fontSize: 13, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  verifyResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 11,
    padding: Spacing[3],
  },
  verifyResultText: { flex: 1, fontSize: 12, fontFamily: 'Inter-Medium', letterSpacing: 0 },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    marginTop: Spacing[1],
  },
});
