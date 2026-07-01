import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { MOCK_DEPARTMENTS } from '../../data/tasks.mock';
import { AUDIT_DATE_RANGE_OPTIONS, AUDIT_FILTER_CATEGORIES, type AuditActor } from '../../data/audit.mock';
import type { AuditFilters } from '../../services/audit.service';
import { DEFAULT_AUDIT_FILTERS } from '../../services/audit.service';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Button } from '../ui/Button';
import { SettingsPickerSheet, type PickerOption } from '../profile/SettingsPickerSheet';

const SectionLabel = ({ label }: { label: string }) => {
  const colors = useColors();
  return <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>{label}</Text>;
};

// Bordered select-box trigger — matches the HTML's dropdown field style
// (screens 37 create-user, 52 filter sheet), distinct from the plain
// list-row style SettingsValueRow uses in Profile → Management.
const SelectBox = ({ value, onPress }: { value: string; onPress: () => void }) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.selectBox,
        { backgroundColor: colors.surface.background, borderColor: colors.surface.border },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
    >
      <Text style={[s.selectBoxText, { color: colors.text.secondary }]} numberOfLines={1}>
        {value}
      </Text>
      <Feather name="chevron-down" size={17} color={colors.text.tertiary} />
    </Pressable>
  );
};

const Pill = ({
  label,
  active,
  onPress,
  fullWidth,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.pill,
        fullWidth && s.pillFullWidth,
        { borderColor: colors.surface.border, backgroundColor: colors.surface.background },
        active && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
        pressed && s.pillPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[s.pillText, { color: active ? colors.text.inverse : colors.text.secondary }]}>{label}</Text>
    </Pressable>
  );
};

type Props = {
  visible: boolean;
  current: AuditFilters;
  actors: AuditActor[];
  onApply: (f: AuditFilters) => void;
  onClose: () => void;
};

export const AuditFilterSheet = ({ visible, current, actors, onApply, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [draft, setDraft] = useState<AuditFilters>(current);
  const [actorPickerVisible, setActorPickerVisible] = useState(false);
  const [deptPickerVisible, setDeptPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) setDraft(current);
  }, [visible, current]);

  const actorOptions: PickerOption<string>[] = [
    { value: 'ANY', label: 'Any admin' },
    ...actors.map((a) => ({ value: a.id, label: a.name })),
  ];
  const departmentOptions: PickerOption<string>[] = [
    { value: 'ALL', label: 'All departments' },
    ...MOCK_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
  ];

  const actorLabel = actorOptions.find((o) => o.value === draft.actorId)?.label ?? 'Any admin';
  const departmentLabel = departmentOptions.find((o) => o.value === draft.departmentId)?.label ?? 'All departments';

  const handleReset = () => setDraft(DEFAULT_AUDIT_FILTERS);
  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[s.backdrop, { backgroundColor: colors.surface.overlay }]} onPress={onClose}>
        <Pressable
          style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}
        >
          <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />

          <View style={[s.header, { borderBottomColor: colors.surface.border }]}>
            <Text style={[s.title, { color: colors.text.primary }]}>Filter log</Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[s.closeBtn, { backgroundColor: colors.surface.background }]}
            >
              <Feather name="x" size={15} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <SectionLabel label="Event type" />
            <View style={s.pillRow}>
              {AUDIT_FILTER_CATEGORIES.map((opt) => (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  active={draft.category === opt.value}
                  onPress={() => setDraft((d) => ({ ...d, category: opt.value }))}
                />
              ))}
            </View>

            <SectionLabel label="Actor" />
            <SelectBox value={actorLabel} onPress={() => setActorPickerVisible(true)} />

            <SectionLabel label="Department" />
            <SelectBox value={departmentLabel} onPress={() => setDeptPickerVisible(true)} />

            <SectionLabel label="Date range" />
            <View style={s.dateRow}>
              {AUDIT_DATE_RANGE_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  active={draft.dateRange === opt.value}
                  onPress={() => setDraft((d) => ({ ...d, dateRange: opt.value }))}
                  fullWidth
                />
              ))}
            </View>

            <View style={s.spacer} />
          </ScrollView>

          <View style={[s.actions, { borderTopColor: colors.surface.border }]}>
            <Pressable onPress={handleReset} style={s.resetBtn}>
              <Text style={[s.resetText, { color: colors.text.secondary }]}>Reset</Text>
            </Pressable>
            <View style={s.applyWrap}>
              <Button label="Show results" onPress={handleApply} fullWidth />
            </View>
          </View>
        </Pressable>
      </Pressable>

      <SettingsPickerSheet
        visible={actorPickerVisible}
        title="Actor"
        options={actorOptions}
        selected={draft.actorId}
        onSelect={(value) => setDraft((d) => ({ ...d, actorId: value }))}
        onClose={() => setActorPickerVisible(false)}
      />
      <SettingsPickerSheet
        visible={deptPickerVisible}
        title="Department"
        options={departmentOptions}
        selected={draft.departmentId}
        onSelect={(value) => setDraft((d) => ({ ...d, departmentId: value }))}
        onClose={() => setDeptPickerVisible(false)}
      />
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[5],
    maxHeight: '88%',
  },
  handle: { width: 38, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: Spacing[3], marginBottom: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3] + 2,
    borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing[5],
    marginBottom: Spacing[3] - 1,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  pill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  pillFullWidth: { flex: 1, alignItems: 'center' },
  pillPressed: { opacity: 0.8 },
  pillText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  selectBox: {
    height: 50,
    borderRadius: 11,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  selectBoxText: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  dateRow: { flexDirection: 'row', gap: Spacing[2] },
  spacer: { height: Spacing[6] },
  actions: { flexDirection: 'row', gap: Spacing[3], paddingTop: Spacing[4], borderTopWidth: 1, alignItems: 'center' },
  resetBtn: { paddingHorizontal: Spacing[3], height: 50, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  applyWrap: { flex: 1 },
});
