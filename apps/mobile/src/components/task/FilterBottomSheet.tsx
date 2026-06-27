import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { TaskPriority } from '@godigitify/types';
import type { SortBy, TaskFilters } from '../../hooks/useTasksMock';
import { MOCK_DEPARTMENTS } from '../../data/tasks.mock';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { Button } from '../ui/Button';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => (
  <Text style={filterStyles.sectionLabel}>{label}</Text>
);

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
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      filterStyles.pill,
      active && filterStyles.pillActive,
      active && color ? { backgroundColor: color, borderColor: color } : null,
      pressed && filterStyles.pillPressed,
    ]}
  >
    {active && !color && (
      <Feather name="check" size={12} color={Colors.text.inverse} />
    )}
    {color && (
      <View style={[filterStyles.dot, { backgroundColor: active ? Colors.text.inverse : color }]} />
    )}
    <Text style={[filterStyles.pillText, active && filterStyles.pillTextActive]}>
      {label}
    </Text>
  </Pressable>
);

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

const PRIORITY_OPTIONS: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Critical', value: 'CRITICAL', color: Colors.priority.critical.solid },
  { label: 'High',     value: 'HIGH',     color: Colors.priority.high.solid },
  { label: 'Medium',   value: 'MEDIUM',   color: Colors.priority.medium.solid },
  { label: 'Low',      value: 'LOW',      color: Colors.priority.low.solid },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const FilterBottomSheet = ({ visible, current, onApply, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = React.useState<SheetFilters>(current);

  // Sync draft when sheet opens with latest filter state
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
      <Pressable style={filterStyles.backdrop} onPress={onClose}>
        <Pressable style={[filterStyles.sheet, { paddingBottom: insets.bottom + Spacing[4] }]}>
          {/* Handle bar */}
          <View style={filterStyles.handle} />

          {/* Header */}
          <View style={filterStyles.header}>
            <Text style={filterStyles.title}>Filter & Sort</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* ── Sort By ── */}
            <SectionLabel label="Sort By" />
            <View style={filterStyles.pillRow}>
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
            <View style={filterStyles.pillRow}>
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
            <View style={filterStyles.pillRow}>
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
            <View style={filterStyles.pillRow}>
              {MOCK_DEPARTMENTS.map((dept) => (
                <OptionPill
                  key={dept.id}
                  label={dept.name}
                  active={draft.departmentId === dept.id}
                  onPress={() => setDept(dept.id)}
                />
              ))}
            </View>

            <View style={filterStyles.spacer} />
          </ScrollView>

          {/* ── Actions ── */}
          <View style={filterStyles.actions}>
            <Pressable onPress={handleReset} style={filterStyles.resetBtn}>
              <Text style={filterStyles.resetText}>Reset All</Text>
            </Pressable>
            <View style={filterStyles.applyWrap}>
              <Button label="Apply Filters" onPress={handleApply} fullWidth />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const filterStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.surface.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[4],
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface.borderStrong,
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
    borderBottomColor: Colors.surface.border,
    marginBottom: Spacing[4],
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  sectionLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.tertiary,
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
    borderColor: Colors.surface.border,
    backgroundColor: Colors.surface.background,
  },
  pillActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  pillPressed: { opacity: 0.8 },
  pillText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  pillTextActive: { color: Colors.text.inverse },
  dot: { width: 8, height: 8, borderRadius: 4 },
  spacer: { height: Spacing[6] },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.surface.border,
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
    color: Colors.text.secondary,
  },
  applyWrap: { flex: 1 },
});
