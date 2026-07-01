import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { AuditEvent } from '../../data/audit.mock';
import { AUDIT_CATEGORY_META } from '../../data/audit.mock';
import { useColors } from '../../constants/colors';
import { BoldSegments } from '../../utils/richText';

type Props = {
  event: AuditEvent;
  onPress: () => void;
  showDivider?: boolean;
};

export const AuditEventRow = React.memo(({ event, onPress, showDivider }: Props) => {
  const colors = useColors();
  const meta = AUDIT_CATEGORY_META[event.category];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomWidth: 1, borderBottomColor: colors.surface.border },
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={event.description}
    >
      <View style={[styles.iconBox, { backgroundColor: event.iconBg }]}>
        <Feather name={event.icon} size={17} color={event.iconColor} />
      </View>
      <View style={styles.body}>
        <BoldSegments
          text={event.description}
          ranges={event.boldRanges}
          style={[styles.description, { color: colors.text.primary }]}
        />
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: meta.badgeBg }]}>
            <Text style={[styles.badgeText, { color: meta.badgeColor }]}>{meta.label}</Text>
          </View>
          <Text style={[styles.contextLabel, { color: colors.text.tertiary }]} numberOfLines={1}>
            {event.contextLabel}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.surface.borderStrong} />
    </Pressable>
  );
});

AuditEventRow.displayName = 'AuditEventRow';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  description: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  contextLabel: { flex: 1, fontSize: 11, fontFamily: 'Inter-Regular', letterSpacing: 0 },
});
