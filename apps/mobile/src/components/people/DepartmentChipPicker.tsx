/**
 * DepartmentChipPicker — "Departments managed" multi-select field (screen 53,
 * Admin role). Shows selected departments as removable chips + an
 * "Add department" trigger that opens the generic MultiSelectSheet.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { MultiSelectSheet } from '../ui/MultiSelectSheet';
import { useColors } from '../../constants/colors';

type DeptRef = { id: string; name: string };

type Props = {
  allDepartments: DeptRef[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
};

export function DepartmentChipPicker({ allDepartments, selectedIds, onChange, error }: Props) {
  const colors = useColors();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [draft, setDraft] = useState<string[]>(selectedIds);

  const openSheet = useCallback(() => {
    setDraft(selectedIds);
    setSheetVisible(true);
  }, [selectedIds]);

  const toggle = useCallback((id: string) => {
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const confirm = useCallback(() => {
    onChange(draft);
    setSheetVisible(false);
  }, [draft, onChange]);

  const selectedDepts = allDepartments.filter((d) => selectedIds.includes(d.id));

  return (
    <>
      <View
        style={[
          s.wrap,
          { backgroundColor: colors.surface.card, borderColor: error ? colors.semantic.error : colors.surface.border },
        ]}
      >
        {selectedDepts.map((d) => (
          <View key={d.id} style={[s.chip, { backgroundColor: '#EEF2FF' }]}>
            <Text style={s.chipText}>{d.name}</Text>
            <Pressable onPress={() => onChange(selectedIds.filter((id) => id !== d.id))} hitSlop={8}>
              <Feather name="x" size={12} color="#4F46E5" />
            </Pressable>
          </View>
        ))}
        <Pressable onPress={openSheet} style={s.addTrigger} accessibilityRole="button" accessibilityLabel="Add department">
          <Feather name="plus" size={14} color={colors.brand.primary} />
          <Text style={[s.addText, { color: colors.brand.primary }]}>Add department</Text>
        </Pressable>
      </View>
      {error ? <Text style={[s.error, { color: colors.semantic.error }]}>{error}</Text> : null}

      <MultiSelectSheet
        visible={sheetVisible}
        title="Departments managed"
        options={allDepartments.map((d) => ({ value: d.id, label: d.name }))}
        selected={draft}
        onToggle={toggle}
        onDone={confirm}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  wrap: {
    minHeight: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold', color: '#4F46E5' },
  addTrigger: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold' },
  error: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 4, marginLeft: 2 },
});
