import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { getInitials } from '../../utils/initial';

type Props = {
  profile?: {
    name?: string | undefined;
    designation?: string | undefined;
    orgName?: string | undefined;
  } | undefined;
  onBackPress: () => void;
};

// Screen 72's compact identity header — non-scrolling strip at the top of
// Part 2, smaller than SuperAdminProfileHeaderCard (44pt avatar vs 74pt),
// same navy signature. Includes a back chevron (absent from the literal HTML
// mockup) since Part 2 is a pushed stack screen in this app's architecture —
// see SuperAdminProfileAccountScreen's header comment.
export const SuperAdminProfileCompactHeader = ({ profile, onBackPress }: Props) => {
  const colors = useColors();
  return (
    <View style={[s.bar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
      <View style={s.titleRow}>
        <Pressable
          onPress={onBackPress}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.title, { color: colors.text.primary }]}>Profile</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={s.row}>
        <View style={[s.avatar, { backgroundColor: colors.brand.secondary }]}>
          <Text style={s.initials}>{getInitials(profile?.name ?? '')}</Text>
        </View>
        <View style={s.textBlock}>
          <Text style={[s.name, { color: colors.text.primary }]} numberOfLines={1}>
            {profile?.name}
          </Text>
          <Text style={[s.designation, { color: colors.text.secondary }]} numberOfLines={1}>
            {profile?.designation} · {profile?.orgName}
          </Text>
        </View>
        <View style={[s.badge, { backgroundColor: colors.brand.secondary }]}>
          <Feather name="shield" size={11} color="#fff" />
          <Text style={s.badgeLabel}>Super Admin</Text>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  bar: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 6 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  title: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, paddingHorizontal: 6 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#fff' },
  textBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  designation: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 13,
    flexShrink: 0,
  },
  badgeLabel: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: '#fff' },
});
