import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import type { ResolvedEscalation } from '../../../services/superAdminTasks.service';
import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing } from '../../../constants/spacing';

type Props = {
  escalation: ResolvedEscalation;
  onNotify: (escalation: ResolvedEscalation) => void;
  onViewAudit: (escalation: ResolvedEscalation) => void;
};

export const EscalationCard = React.memo(({ escalation, onNotify, onViewAudit }: Props) => {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <View style={[styles.stripe, { backgroundColor: escalation.barColor }]} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={[styles.typeBadge, { backgroundColor: escalation.badgeBg }]}>
            <Text style={[styles.typeText, { color: escalation.badgeColor }]}>
              {escalation.typeLabel.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.text.tertiary }]}>{dayjs(escalation.detectedAt).fromNow()}</Text>
        </View>

        <Text style={[styles.headline, { color: colors.text.primary }]}>{escalation.headline}</Text>

        <View style={styles.ownerRow}>
          <View style={[styles.ownerAvatar, { backgroundColor: colors.brand.secondary }]}>
            <Text style={styles.ownerInitials}>{escalation.ownerInitials}</Text>
          </View>
          <Text style={[styles.ownerText, { color: colors.text.secondary }]} numberOfLines={1}>
            Owner · {escalation.ownerName} (Admin){escalation.ownerActioned ? '' : ' — not yet actioned'}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onNotify(escalation)}
            style={({ pressed }) => [styles.notifyBtn, { backgroundColor: colors.brand.secondary }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Notify ${escalation.ownerName}`}
          >
            <Text style={styles.notifyText}>Notify admin</Text>
          </Pressable>
          <Pressable
            onPress={() => onViewAudit(escalation)}
            style={({ pressed }) => [styles.auditBtn, { borderColor: colors.surface.border }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="View audit trail"
          >
            <Text style={[styles.auditText, { color: colors.text.secondary }]}>View audit</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

EscalationCard.displayName = 'EscalationCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  stripe: { height: 4 },
  body: { padding: Spacing[3] + 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  typeBadge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: {
    fontSize: 9.5,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  time: { fontSize: 11, fontFamily: 'Inter-Regular', marginLeft: 'auto' },
  headline: {
    ...Typography.h4,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 9,
  },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  ownerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitials: { fontSize: 9, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  ownerText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  actionsRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  notifyBtn: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  auditBtn: {
    width: 110,
    height: 40,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold' },
  pressed: { opacity: 0.85 },
});
