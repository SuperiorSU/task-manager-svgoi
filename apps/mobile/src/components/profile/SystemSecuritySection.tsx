import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Props = {
  onAuditLogPress: () => void;
  onOrgConfigPress: () => void;
};

// Screen 71's "System & security" card — SA-only. Uses chip-boxed icons
// (colored rounded-square background) rather than ProfileSettingsItem's bare
// icon, matching the HTML exactly; this card is visually distinct from every
// other Profile section for that reason. "Security & 2FA" has no href in the
// HTML mockup either (only Audit log and Organization configuration do) —
// biometric/2FA is explicitly "architecture ready, not triggered" per
// 8_overview.md §11, so it's rendered as a status row, not a live link.
export const SystemSecuritySection = ({ onAuditLogPress, onOrgConfigPress }: Props) => {
  const colors = useColors();
  return (
    <>
      <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>System &amp; security</Text>
      <View style={[s.card, { backgroundColor: colors.surface.card }]}>
        <Pressable
          onPress={onAuditLogPress}
          style={({ pressed }) => [s.row, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <View style={[s.iconChip, { backgroundColor: colors.status.underReview.bg }]}>
            <Feather name="list" size={17} color={colors.status.underReview.text} />
          </View>
          <Text style={[s.label, { color: colors.text.primary }]} numberOfLines={1}>Audit log</Text>
          <View style={[s.pill, { backgroundColor: colors.status.underReview.bg }]}>
            <Text style={[s.pillLabel, { color: colors.status.underReview.text }]}>IMMUTABLE</Text>
          </View>
          <Feather name="chevron-right" size={17} color={colors.surface.borderStrong} />
        </Pressable>
        <View style={[s.divider, { backgroundColor: colors.surface.border }]} />

        <Pressable
          onPress={onOrgConfigPress}
          style={({ pressed }) => [s.row, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <View style={[s.iconChip, { backgroundColor: colors.semantic.infoBg }]}>
            <Feather name="settings" size={17} color={colors.brand.primary} />
          </View>
          <Text style={[s.label, { color: colors.text.primary }]}>Organization configuration</Text>
          <Feather name="chevron-right" size={17} color={colors.surface.borderStrong} />
        </Pressable>
        <View style={[s.divider, { backgroundColor: colors.surface.border }]} />

        <View style={s.row}>
          <View style={[s.iconChip, { backgroundColor: colors.priority.low.bg }]}>
            <Feather name="shield" size={17} color={colors.priority.low.text} />
          </View>
          <Text style={[s.label, { color: colors.text.primary }]}>Security &amp; 2FA</Text>
          <View style={s.statusWrap}>
            <View style={[s.statusDot, { backgroundColor: colors.semantic.success }]} />
            <Text style={[s.statusLabel, { color: colors.priority.low.text }]}>On</Text>
          </View>
        </View>
      </View>
    </>
  );
};

const s = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 2,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 13,
  },
  pressed: { opacity: 0.7 },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular' },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    marginRight: 2,
  },
  pillLabel: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  divider: { height: 1, marginLeft: 59 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
});
