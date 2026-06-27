import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export const TaskSearchBar = React.memo(({ value, onChangeText, placeholder = 'Search tasks, projects, departments...' }: Props) => (
  <View style={styles.wrapper}>
    <View style={styles.row}>
      <Feather name="search" size={16} color={Colors.text.tertiary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
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
          <View style={styles.clearBtn}>
            <Feather name="x" size={12} color={Colors.text.inverse} />
          </View>
        </Pressable>
      )}
    </View>
  </View>
));

TaskSearchBar.displayName = 'TaskSearchBar';

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.surface.background,
    borderRadius: 10,
    paddingHorizontal: Spacing[3],
    height: 44,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  input: {
    flex: 1,
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
