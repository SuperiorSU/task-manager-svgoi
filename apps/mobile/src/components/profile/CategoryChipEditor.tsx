import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Props = {
  categories: string[];
  onAdd: (category: string) => void;
  onRemove: (category: string) => void;
};

export const CategoryChipEditor = ({ categories, onAdd, onRemove }: Props) => {
  const colors = useColors();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && !categories.includes(trimmed)) onAdd(trimmed);
    setDraft('');
    setAdding(false);
  };

  return (
    <View style={s.wrap}>
      {categories.map((cat) => (
        <View
          key={cat}
          style={[s.chip, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
        >
          <Text style={[s.chipLabel, { color: colors.text.secondary }]}>{cat}</Text>
          <Pressable onPress={() => onRemove(cat)} hitSlop={8}>
            <Feather name="x" size={12} color={colors.surface.borderStrong} />
          </Pressable>
        </View>
      ))}

      {adding ? (
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          onBlur={commit}
          placeholder="Category"
          placeholderTextColor={colors.text.tertiary}
          style={[
            s.chip,
            s.chipInput,
            { backgroundColor: colors.brand.primaryLight, borderColor: colors.brand.primary, color: colors.text.primary },
          ]}
        />
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          style={[s.chip, s.addChip, { backgroundColor: colors.brand.primaryLight, borderColor: colors.brand.primary }]}
        >
          <Feather name="plus" size={13} color={colors.brand.primary} />
          <Text style={[s.chipLabel, { color: colors.brand.primary, fontFamily: 'Inter-SemiBold' }]}>Add</Text>
        </Pressable>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  chipLabel: { fontSize: 12.5, fontFamily: 'Inter-Medium' },
  addChip: { borderStyle: 'dashed' },
  chipInput: { minWidth: 90, fontSize: 12.5, fontFamily: 'Inter-Medium', paddingVertical: 6 },
});
