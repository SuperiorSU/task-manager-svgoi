import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export const TaskSearchBar = React.memo(({ value, onChangeText, placeholder = 'Search tasks, projects, departments...' }: Props) => {
  const colors = useColors();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
      <View style={[styles.row, { backgroundColor: colors.surface.background, borderColor: colors.surface.border }]}>
        <Feather name="search" size={16} color={colors.text.tertiary} />
        <TextInput
          style={[styles.input, { color: colors.text.primary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear search"
          >
            <View style={[styles.clearBtn, { backgroundColor: colors.text.tertiary }]}>
              <Feather name="x" size={12} color={colors.text.inverse} />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
});

TaskSearchBar.displayName = 'TaskSearchBar';

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    borderRadius: 10,
    paddingHorizontal: Spacing[3],
    height: 44,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
