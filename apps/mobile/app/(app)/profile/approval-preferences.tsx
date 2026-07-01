import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../src/constants/colors';
import {
  useApprovalPreferences,
  useUpdateApprovalPreferences,
} from '../../../src/hooks/useAdminSettings';
import {
  ON_REJECTION_OPTIONS,
  REVIEW_WITHIN_OPTIONS,
  type ApprovalPreferences,
  type ApproverScope,
} from '../../../src/data/adminSettings.mock';

import { SettingsToggleRow } from '../../../src/components/profile/SettingsToggleRow';
import { SettingsValueRow } from '../../../src/components/profile/SettingsValueRow';
import { SettingsRadioCard } from '../../../src/components/profile/SettingsRadioCard';
import { SettingsPickerSheet } from '../../../src/components/profile/SettingsPickerSheet';

const APPROVER_OPTIONS: { value: ApproverScope; label: string }[] = [
  { value: 'ADMIN_ONLY', label: 'Only me (Dept Admin)' },
  { value: 'ADMIN_AND_SENIOR', label: 'Me + senior members' },
];

export default function ApprovalPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: prefs, isLoading } = useApprovalPreferences();
  const { mutate: save, isPending } = useUpdateApprovalPreferences();

  const [draft, setDraft] = useState<ApprovalPreferences | null>(null);
  const [sheet, setSheet] = useState<'onRejection' | 'reviewWithin' | null>(null);

  useEffect(() => {
    if (prefs && !draft) setDraft(prefs);
  }, [prefs, draft]);

  const patch = (fields: Partial<ApprovalPreferences>) =>
    setDraft((d) => (d ? { ...d, ...fields } : d));

  const handleSave = () => {
    if (!draft) return;
    save(draft, { onSuccess: () => router.back() });
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Approval preferences</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading || !draft ? (
        <View style={s.loader}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Review flow</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsToggleRow
                label="Require proof of work"
                subtitle="Members must attach a file to submit"
                enabled={draft.requireProofOfWork}
                onToggle={() => patch({ requireProofOfWork: !draft.requireProofOfWork })}
                showDivider
              />
              <SettingsToggleRow
                label="Auto-approve low priority"
                subtitle="Skip review for Low-priority tasks"
                enabled={draft.autoApproveLowPriority}
                onToggle={() => patch({ autoApproveLowPriority: !draft.autoApproveLowPriority })}
                showDivider
              />
              <SettingsValueRow
                label="Required on rejection"
                value={ON_REJECTION_OPTIONS.find((o) => o.value === draft.onRejection)?.label ?? ''}
                onPress={() => setSheet('onRejection')}
              />
            </View>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Who can approve</Text>
            <SettingsRadioCard
              options={APPROVER_OPTIONS}
              selected={draft.approverScope}
              onSelect={(approverScope) => patch({ approverScope })}
            />

            <Text style={[s.sectionLabel, { color: colors.text.tertiary, marginTop: 20 }]}>
              Reminders &amp; escalation
            </Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsValueRow
                label="Review within"
                value={
                  REVIEW_WITHIN_OPTIONS.find((o) => o.value === draft.reviewWithinHours)?.label ?? ''
                }
                onPress={() => setSheet('reviewWithin')}
                showDivider
              />
              <SettingsToggleRow
                label="Escalate overdue reviews"
                subtitle="Notify Super Admin after SLA"
                enabled={draft.escalateOverdueReviews}
                onToggle={() => patch({ escalateOverdueReviews: !draft.escalateOverdueReviews })}
              />
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface.card, borderTopColor: colors.surface.border }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[s.cancelLabel, { color: colors.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isPending}
              style={({ pressed }) => [s.saveBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.85 }]}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.saveLabel}>Save preferences</Text>
              )}
            </Pressable>
          </View>

          <SettingsPickerSheet
            visible={sheet === 'onRejection'}
            title="Required on rejection"
            options={ON_REJECTION_OPTIONS}
            selected={draft.onRejection}
            onSelect={(onRejection) => patch({ onRejection })}
            onClose={() => setSheet(null)}
          />
          <SettingsPickerSheet
            visible={sheet === 'reviewWithin'}
            title="Review within"
            options={REVIEW_WITHIN_OPTIONS}
            selected={draft.reviewWithinHours}
            onSelect={(reviewWithinHours) => patch({ reviewWithinHours })}
            onClose={() => setSheet(null)}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    width: 96,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  saveBtn: { flex: 1, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#fff' },
});
