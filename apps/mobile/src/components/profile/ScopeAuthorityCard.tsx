import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Row = {
  icon: keyof typeof Feather.glyphMap;
  subLabel: string;
  value: string;
  tag?: string;
};

const ROWS: Row[] = [
  { icon: 'globe', subLabel: 'Visibility scope', value: 'All departments · org-wide', tag: 'Org' },
  { icon: 'users', subLabel: 'Authority', value: 'User & department management' },
  { icon: 'shield', subLabel: 'Task privacy', value: 'Rollups only · no task contents (FR-72)' },
];

// Screen 71's "Scope & authority" card — fixed structural copy describing the
// Super Admin role model (8_overview.md §2, FR-72), not mock business data.
// Same 3-fact shape across every SA account, so it's authored directly here
// rather than routed through a service.
export const ScopeAuthorityCard = () => {
  const colors = useColors();
  return (
    <>
      <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Scope &amp; authority</Text>
      <View style={[s.card, { backgroundColor: colors.surface.card }]}>
        {ROWS.map((row, i) => (
          <React.Fragment key={row.subLabel}>
            <View style={s.row}>
              <Feather name={row.icon} size={19} color={colors.text.tertiary} />
              <View style={s.textBlock}>
                <Text style={[s.subLabel, { color: colors.text.tertiary }]}>{row.subLabel}</Text>
                <Text style={[s.value, { color: colors.text.primary }]}>{row.value}</Text>
              </View>
              {row.tag && (
                <View style={[s.tag, { backgroundColor: colors.brand.primaryLight }]}>
                  <Text style={[s.tagLabel, { color: colors.brand.primaryDark }]}>{row.tag}</Text>
                </View>
              )}
            </View>
            {i < ROWS.length - 1 && (
              <View style={[s.divider, { backgroundColor: colors.surface.border }]} />
            )}
          </React.Fragment>
        ))}
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
    marginBottom: 20,
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
    paddingVertical: 13,
    gap: 13,
  },
  textBlock: { flex: 1 },
  subLabel: { fontSize: 11, fontFamily: 'Inter-Regular' },
  value: { fontSize: 13, fontFamily: 'Inter-Regular', marginTop: 1 },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 11,
  },
  tagLabel: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  divider: { height: 1, marginLeft: 48 },
});
