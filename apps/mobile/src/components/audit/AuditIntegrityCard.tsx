import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export const AuditIntegrityCard = React.memo(({ hash }: { hash: string }) => {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.brand.secondary }]}>
      <View style={styles.iconBox}>
        <Feather name="shield" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Tamper-evident record</Text>
        <Text style={styles.hash}>sha256 · {hash} · verified</Text>
      </View>
    </View>
  );
});

AuditIntegrityCard.displayName = 'AuditIntegrityCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: 14,
    padding: Spacing[4],
    shadowColor: '#0D2270',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
  hash: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#A5B4E0', letterSpacing: 0, marginTop: 2 },
});
