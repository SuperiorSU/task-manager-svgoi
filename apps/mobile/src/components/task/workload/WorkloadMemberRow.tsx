import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { WorkloadMember } from '../../../services/adminWorkload.service';
import { WORKLOAD_TIER_META } from '../../../data/adminWorkload.mock';
import { useColors } from '../../../constants/colors';

type Props = {
  member: WorkloadMember;
  onPress: (userId: string) => void;
};

// "Team workload — full" per-person row (HTML screen 73) — avatar, OVER/FREE
// badge when at either capacity extreme, active count, and a capacity bar
// colour-coded by tier.
export const WorkloadMemberRow = React.memo(({ member, onPress }: Props) => {
  const colors = useColors();
  const meta = WORKLOAD_TIER_META[member.tier];
  const barPercent = Math.min(100, member.capacityPercent);

  return (
    <Pressable
      onPress={() => onPress(member.userId)}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface.card }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.activeCount} active tasks, ${member.capacityPercent}% capacity`}
    >
      <View style={[styles.avatar, { backgroundColor: member.avatarBg }]}>
        <Text style={[styles.avatarText, { color: member.avatarFg }]}>{member.initials}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
              {member.name}
            </Text>
            {meta.badgeLabel && (
              <View style={[styles.badge, { backgroundColor: meta.badgeBg }]}>
                <Text style={[styles.badgeText, { color: meta.badgeColor }]}>{meta.badgeLabel}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.activeCount,
              { color: member.tier === 'OVER' ? (meta.badgeColor ?? meta.barColor) : colors.text.tertiary },
            ]}
          >
            {member.activeCount} active
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surface.background }]}>
          <View style={[styles.fill, { width: `${barPercent}%`, backgroundColor: meta.barColor }]} />
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.surface.borderStrong} />
    </Pressable>
  );
});

WorkloadMemberRow.displayName = 'WorkloadMemberRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 13,
    padding: 13,
    marginBottom: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 12, fontFamily: 'Inter-Bold' },
  info: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1, minWidth: 0 },
  name: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', flexShrink: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, flexShrink: 0 },
  badgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  activeCount: { fontSize: 11, fontFamily: 'Inter-SemiBold', flexShrink: 0 },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
