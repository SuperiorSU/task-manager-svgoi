import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { TaskPriority } from '@godigitify/types';
import type { SortBy, TaskFilters } from '../../hooks/useTasksMock';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@godigitify/api-client';
import { queryKeys } from '../../constants/queryKeys';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Button } from '../ui/Button';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => {
  const colors = useColors();
  return (
    <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>{label}</Text>
  );
};

const OptionPill = ({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.pill,
        { borderColor: colors.surface.border, backgroundColor: colors.surface.background },
        active && !color && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
        active && color ? { backgroundColor: color, borderColor: color } : null,
        pressed && s.pillPressed,
      ]}
    >
      {active && !color && (
        <Feather name="check" size={12} color={colors.text.inverse} />
      )}
      {color && (
        <View style={[s.dot, { backgroundColor: active ? colors.text.inverse : color }]} />
      )}
      <Text style={[s.pillText, { color: active ? colors.text.inverse : colors.text.secondary }]}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SheetFilters = Pick<TaskFilters, 'sortBy' | 'sortOrder' | 'priorities' | 'departmentId'>;

type Props = {
  visible: boolean;
  current: SheetFilters;
  onApply: (f: SheetFilters) => void;
  onClose: () => void;
};

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Due Date',      value: 'dueDate' },
  { label: 'Created Date',  value: 'createdAt' },
  { label: 'Priority',      value: 'priority' },
  { label: 'Title (A–Z)',   value: 'title' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const FilterBottomSheet = ({ visible, current, onApply, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const PRIORITY_OPTIONS: { label: string; value: TaskPriority; color: string }[] = [
    { label: 'Critical', value: 'CRITICAL', color: colors.priority.critical.solid },
    { label: 'High',     value: 'HIGH',     color: colors.priority.high.solid },
    { label: 'Medium',   value: 'MEDIUM',   color: colors.priority.medium.solid },
    { label: 'Low',      value: 'LOW',      color: colors.priority.low.solid },
  ];
  const [draft, setDraft] = React.useState<SheetFilters>(current);
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => departmentsApi.getList().then((r) => r.data),
    staleTime: 10 * 60 * 1_000,
  });

  React.useEffect(() => {
    if (visible) setDraft(current);
  }, [visible, current]);

  const togglePriority = useCallback((p: TaskPriority) => {
    setDraft((d) => ({
      ...d,
      priorities: d.priorities.includes(p)
        ? d.priorities.filter((x) => x !== p)
        : [...d.priorities, p],
    }));
  }, []);

  const setDept = useCallback((id: string | null) => {
    setDraft((d) => ({ ...d, departmentId: id === d.departmentId ? null : id }));
  }, []);

  const handleReset = useCallback(() => {
    setDraft({ sortBy: 'dueDate', sortOrder: 'asc', priorities: [], departmentId: null });
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[s.backdrop, { backgroundColor: colors.surface.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            s.sheet,
            { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] },
          ]}
        >
          {/* Handle bar */}
          <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />

          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.surface.border }]}>
            <Text style={[s.title, { color: colors.text.primary }]}>Filter & Sort</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* ── Sort By ── */}
            <SectionLabel label="Sort By" />
            <View style={s.pillRow}>
              {SORT_OPTIONS.map((opt) => (
                <OptionPill
                  key={opt.value}
                  label={opt.label}
                  active={draft.sortBy === opt.value}
                  onPress={() => setDraft((d) => ({ ...d, sortBy: opt.value }))}
                />
              ))}
            </View>

            {/* ── Sort Order ── */}
            <SectionLabel label="Order" />
            <View style={s.pillRow}>
              <OptionPill
                label="Ascending"
                active={draft.sortOrder === 'asc'}
                onPress={() => setDraft((d) => ({ ...d, sortOrder: 'asc' }))}
              />
              <OptionPill
                label="Descending"
                active={draft.sortOrder === 'desc'}
                onPress={() => setDraft((d) => ({ ...d, sortOrder: 'desc' }))}
              />
            </View>

            {/* ── Priority ── */}
            <SectionLabel label="Priority" />
            <View style={s.pillRow}>
              {PRIORITY_OPTIONS.map((opt) => (
                <OptionPill
                  key={opt.value}
                  label={opt.label}
                  active={draft.priorities.includes(opt.value)}
                  color={opt.color}
                  onPress={() => togglePriority(opt.value)}
                />
              ))}
            </View>

            {/* ── Department ── */}
            <SectionLabel label="Department" />
            <View style={s.pillRow}>
              {departments.map((dept) => (
                <OptionPill
                  key={dept.id}
                  label={dept.name}
                  active={draft.departmentId === dept.id}
                  onPress={() => setDept(dept.id)}
                />
              ))}
            </View>

            <View style={s.spacer} />
          </ScrollView>

          {/* ── Actions ── */}
          <View style={[s.actions, { borderTopColor: colors.surface.border }]}>
            <Pressable onPress={handleReset} style={s.resetBtn}>
              <Text style={[s.resetText, { color: colors.text.secondary }]}>Reset All</Text>
            </Pressable>
            <View style={s.applyWrap}>
              <Button label="Apply Filters" onPress={handleApply} fullWidth />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[4],
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    marginBottom: Spacing[4],
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
  },
  sectionLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing[2],
    marginTop: Spacing[4],
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillPressed: { opacity: 0.8 },
  pillText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  spacer: { height: Spacing[6] },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    alignItems: 'center',
  },
  resetBtn: {
    paddingHorizontal: Spacing[4],
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    ...Typography.labelLg,
    fontFamily: 'Inter-Medium',
  },
  applyWrap: { flex: 1 },
});
