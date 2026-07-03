import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { AuditDetailField } from '../../utils/auditPresentation';
import { useColors } from '../../constants/colors';

export const AuditDetailCard = React.memo(({ fields }: { fields: AuditDetailField[] }) => {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}>
      {fields.map((field, idx) => (
        <View
          key={field.label}
          style={[
            styles.row,
            idx < fields.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.surface.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.text.secondary }]}>{field.label}</Text>
          <Text
            style={[
              styles.value,
              { color: field.accent ? colors.brand.secondary : colors.text.primary },
              field.accent && styles.valueAccent,
            ]}
            numberOfLines={1}
          >
            {field.value}
          </Text>
        </View>
      ))}
    </View>
  );
});

AuditDetailCard.displayName = 'AuditDetailCard';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  label: { fontSize: 13, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  value: { flex: 1, textAlign: 'right', fontSize: 12.5, fontFamily: 'Inter-Medium', letterSpacing: 0 },
  valueAccent: { fontFamily: 'Inter-SemiBold' },
});
