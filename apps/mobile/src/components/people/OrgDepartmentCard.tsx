/**
 * OrgDepartmentCard — People → Departments view row (screen 56).
 * Icon · name + code (+ NEW badge for session-created depts) · head/members ·
 * completion progress bar.
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { OrgDepartmentWithStats } from '../../hooks/useOrgDirectory';
import { useColors } from '../../constants/colors';
import { rateColor, rateTextColor } from '../../utils/completionRate';

type Props = {
  department: OrgDepartmentWithStats;
  onPress?: (department: OrgDepartmentWithStats) => void;
};

export const OrgDepartmentCard = React.memo(({ department, onPress }: Props) => {
  const colors = useColors();
  const isNew = department.createdInSession;

  return (
    <Pressable
      onPress={onPress ? () => onPress(department) : undefined}
      disabled={!onPress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: colors.surface.card,
          ...(isNew ? { borderWidth: 1, borderColor: '#C7D2FE', borderStyle: 'dashed' as const } : {}),
        },
        pressed && onPress && { opacity: 0.85 },
      ]}
    >
      <View style={s.topRow}>
        <View style={[s.icon, { backgroundColor: '#EEF2FF' }]}>
          <Feather name="briefcase" size={19} color="#4F46E5" />
        </View>

        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: colors.text.primary }]} numberOfLines={1}>
              {department.name}
            </Text>
            <Text style={[s.code, { color: colors.text.tertiary }]}>{department.code}</Text>
            {isNew && (
              <View style={s.newBadge}>
                <Text style={s.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
          <View style={s.metaRow}>
            <Text style={[s.metaText, { color: colors.text.secondary }]} numberOfLines={1}>
              Head: {department.headName ?? 'Unassigned'}
            </Text>
            <Text style={[s.metaSep, { color: colors.surface.borderStrong }]}>·</Text>
            <Text style={[s.metaText, { color: colors.text.secondary }]}>
              {department.memberCount} {department.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        <Feather name="chevron-right" size={18} color={colors.surface.borderStrong} />
      </View>

      {department.memberCount > 0 && (
        <View style={s.progressRow}>
          <View style={[s.track, { backgroundColor: colors.surface.background }]}>
            <View
              style={[
                s.fill,
                { width: `${department.completionRate}%`, backgroundColor: rateColor(department.completionRate, colors) },
              ]}
            />
          </View>
          <Text style={[s.rate, { color: rateTextColor(department.completionRate, colors) }]}>
            {department.completionRate}%
          </Text>
        </View>
      )}
    </Pressable>
  );
});

OrgDepartmentCard.displayName = 'OrgDepartmentCard';

const s = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 15, fontFamily: 'Inter-SemiBold', letterSpacing: 0, flexShrink: 1 },
  code: { fontSize: 10, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  newBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, flexShrink: 0 },
  newBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3, color: '#1D4ED8' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { fontSize: 11.5, fontFamily: 'Inter-Regular', flexShrink: 1 },
  metaSep: { fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  track: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  rate: { fontSize: 11.5, fontFamily: 'Inter-Bold', letterSpacing: 0 },
});
