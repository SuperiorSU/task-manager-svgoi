import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { getInitials } from '../../utils/initial';

type Props = {
  managerName: string;
  managerRoleLabel: string;
};

// "Reports to" card shown on the Admin Profile screen (screen 45 of the HTML
// reference) — an Admin's reporting line up to their Super Admin.
export const ProfileReportingCard = ({ managerName, managerRoleLabel }: Props) => {
  const colors = useColors();

  return (
    <>
      <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Reporting</Text>
      <View style={[s.card, { backgroundColor: colors.surface.card }]}>
        <View style={[s.avatar, { backgroundColor: colors.brand.secondary }]}>
          <Text style={s.initials}>{getInitials(managerName)}</Text>
        </View>
        <View style={s.textBlock}>
          <Text style={[s.subLabel, { color: colors.text.tertiary }]}>Reports to</Text>
          <Text style={[s.name, { color: colors.text.primary }]} numberOfLines={1}>
            {managerName}
          </Text>
        </View>
        <View style={[s.roleBadge, { backgroundColor: colors.surface.background }]}>
          <Text style={[s.roleBadgeText, { color: colors.text.secondary }]}>{managerRoleLabel}</Text>
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
    marginBottom: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#fff' },
  textBlock: { flex: 1, minWidth: 0 },
  subLabel: { fontSize: 11, fontFamily: 'Inter-Regular' },
  name: { fontSize: 13, fontFamily: 'Inter-Medium', marginTop: 1 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
});
