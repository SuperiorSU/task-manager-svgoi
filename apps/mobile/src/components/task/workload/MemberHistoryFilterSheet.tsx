import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DATE_RANGE_OPTIONS,
  DEFAULT_DATE_RANGE,
  type HistoryDateRange,
  type HistorySortOrder,
} from '../../../data/adminWorkload.mock';
import { useColors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Button } from '../../ui/Button';

type Draft = { dateRange: HistoryDateRange; sortOrder: HistorySortOrder };

type Props = {
  visible: boolean;
  current: Draft;
  /** Live preview count for the current draft's date range (sort order doesn't change the count). */
  previewCount: (dateRange: HistoryDateRange) => number;
  onApply: (draft: Draft) => void;
  onClose: () => void;
};

// "Filter history" bottom sheet (HTML screen 75) — date range pills + sort
// order, with a live "Show N tasks" preview on the apply button.
export const MemberHistoryFilterSheet = ({ visible, current, previewCount, onApply, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [draft, setDraft] = useState<Draft>(current);

  useEffect(() => {
    if (visible) setDraft(current);
  }, [visible, current]);

  const handleReset = useCallback(() => setDraft({ dateRange: DEFAULT_DATE_RANGE, sortOrder: 'newest' }), []);
  const handleApply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[s.backdrop, { backgroundColor: colors.surface.overlay }]} onPress={onClose}>
        <Pressable
          style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}
        >
          <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />
          <View style={s.header}>
            <Text style={[s.title, { color: colors.text.primary }]}>Filter history</Text>
            <Pressable onPress={handleReset} hitSlop={8}>
              <Text style={[s.reset, { color: colors.brand.primary }]}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Date range</Text>
            <View style={s.pillRow}>
              {DATE_RANGE_OPTIONS.map((opt) => {
                const isActive = draft.dateRange === opt.value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => setDraft((d) => ({ ...d, dateRange: opt.value }))}
                    style={({ pressed }) => [
                      s.pill,
                      { borderColor: colors.surface.border, backgroundColor: colors.surface.background },
                      isActive && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
                      pressed && s.pillPressed,
                    ]}
                  >
                    <Text style={[s.pillText, { color: isActive ? colors.text.inverse : colors.text.secondary }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Sort by</Text>
            <View style={s.segmentRow}>
              <SegmentButton
                label="Newest first"
                active={draft.sortOrder === 'newest'}
                onPress={() => setDraft((d) => ({ ...d, sortOrder: 'newest' }))}
              />
              <SegmentButton
                label="Oldest first"
                active={draft.sortOrder === 'oldest'}
                onPress={() => setDraft((d) => ({ ...d, sortOrder: 'oldest' }))}
              />
            </View>

            <View style={s.spacer} />
          </ScrollView>

          <Button label={`Show ${previewCount(draft.dateRange)} tasks`} onPress={handleApply} fullWidth />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.segment,
        { borderColor: colors.surface.border, backgroundColor: colors.surface.background },
        active && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
        pressed && s.pillPressed,
      ]}
    >
      <Text style={[s.segmentText, { color: active ? colors.text.inverse : colors.text.secondary }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: Spacing[5], maxHeight: '82%' },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing[2] },
  title: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  reset: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing[4],
    marginBottom: Spacing[3],
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  pill: { height: 34, paddingHorizontal: 15, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillPressed: { opacity: 0.8 },
  pillText: { fontSize: 13, fontFamily: 'Inter-Medium' },
  segmentRow: { flexDirection: 'row', gap: Spacing[2] },
  segment: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  spacer: { height: Spacing[6] },
});
