import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { ProfileInfoCard } from './ProfileInfoCard';

interface ProfileAccountSectionProps {
  profile?: {
    email?: string;
    phone?: string;
    employeeId?: string;
  } | undefined;
  /** Label for the read-only ID row — defaults to "Employee ID · read-only". */
  idLabel?: string | undefined;
}

export const ProfileAccountSection = ({ profile, idLabel }: ProfileAccountSectionProps) => {
  const colors = useColors();
  return (
    <>
      <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>Account</Text>
      <View style={styles.cardWrap}>
        <ProfileInfoCard
          rows={[
            { icon: 'mail', subLabel: 'Email', value: profile?.email ?? '' },
            { icon: 'phone', subLabel: 'Phone', value: profile?.phone ?? '' },
            {
              icon: 'credit-card',
              subLabel: idLabel ?? 'Employee ID · read-only',
              value: profile?.employeeId ?? '',
              readOnly: true,
            },
          ]}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 2,
  },
  cardWrap: {
    marginBottom: 20,
  },
});