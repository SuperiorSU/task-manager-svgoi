import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { MockSubtask } from '../../../data/tasks.mock';

import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, Layout } from '../../../constants/spacing';

type Props = {
  subtasks: MockSubtask[];
};

export const TaskSubtasksSection = React.memo(({ subtasks }: Props) => {
  const [expanded, setExpanded] = useState(true);

  if (subtasks.length === 0) return null;

  const completed = subtasks.filter((s) => s.completed).length;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={styles.header}
        accessibilityRole="button"
      >
        <View style={styles.titleRow}>
          <Feather name="check-square" size={16} color={Colors.brand.primary} />
          <Text style={styles.title}>Subtasks</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {completed}/{subtasks.length}
            </Text>
          </View>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.text.tertiary}
        />
      </Pressable>

      {expanded && (
        <View style={styles.list}>
          {subtasks.map((sub) => (
            <View key={sub.id} style={styles.item}>
              <View style={[styles.checkbox, sub.completed && styles.checkboxDone]}>
                {sub.completed && (
                  <Feather name="check" size={11} color={Colors.text.inverse} />
                )}
              </View>
              <Text
                style={[styles.itemText, sub.completed && styles.itemTextDone]}
                numberOfLines={2}
              >
                {sub.title}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

TaskSubtasksSection.displayName = 'TaskSubtasksSection';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    color: Colors.brand.primary,
  },
  list: { gap: Spacing[3] },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxDone: {
    backgroundColor: Colors.semantic.success,
    borderColor: Colors.semantic.success,
  },
  itemText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  itemTextDone: {
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
});
