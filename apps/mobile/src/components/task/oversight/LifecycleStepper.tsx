import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { GovernanceStage } from '@godigitify/types';
import { useColors } from '../../../constants/colors';

const STEPS: { key: Exclude<GovernanceStage, 'REVISION_REQUESTED'>; label: string }[] = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'APPROVED', label: 'Approved' },
];

// REVISION_REQUESTED sits back at the "in progress" position — the admin is
// working on it again — but is rendered in a distinct (amber/red) tone below
// so it doesn't read as a normal in-progress step.
const STEP_ORDER: Record<GovernanceStage, number> = {
  ASSIGNED: 1,
  IN_PROGRESS: 2,
  SUBMITTED: 3,
  APPROVED: 4,
  REVISION_REQUESTED: 2,
};

type Props = { stage: GovernanceStage };

// Governance task tracking progress rail (screen 63) — 4-step lifecycle
// distinct from TaskActivityTimeline (which lists individual events, not the
// overall stage). Built fresh since no equivalent stepper exists elsewhere.
export const LifecycleStepper = React.memo(({ stage }: Props) => {
  const colors = useColors();
  const currentIndex = STEP_ORDER[stage];
  const isRevision = stage === 'REVISION_REQUESTED';
  const activeColor = isRevision ? '#B91C1C' : '#7C3AED';
  const activeBg = isRevision ? '#FEF2F2' : '#F5F3FF';

  return (
    <View>
      <View style={styles.row}>
        {STEPS.map((step, idx) => {
          const stepIndex = idx + 1;
          const done = stepIndex < currentIndex;
          const active = stepIndex === currentIndex;
          const isLast = idx === STEPS.length - 1;
          const label = active && isRevision && step.key === 'IN_PROGRESS' ? 'Sent back' : step.label;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.dot,
                    done && { backgroundColor: colors.brand.primary },
                    active && { backgroundColor: activeBg, borderWidth: 2, borderColor: activeColor },
                    !done && !active && { backgroundColor: colors.surface.card, borderWidth: 2, borderColor: colors.surface.border },
                  ]}
                >
                  {done && <Feather name="check" size={13} color="#FFFFFF" />}
                  {active && <View style={[styles.activeInnerDot, { backgroundColor: activeColor }]} />}
                  {!done && !active && <Feather name="check" size={12} color={colors.surface.borderStrong} />}
                </View>
                <Text
                  style={[
                    styles.label,
                    { color: done ? colors.brand.primary : active ? activeColor : colors.text.tertiary },
                    (done || active) && styles.labelActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: stepIndex < currentIndex ? colors.brand.primary : colors.surface.border },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
});

LifecycleStepper.displayName = 'LifecycleStepper';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  stepCol: { alignItems: 'center', gap: 6 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeInnerDot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 9.5, fontFamily: 'Inter-Medium' },
  labelActive: { fontFamily: 'Inter-SemiBold' },
  connector: { flex: 1, height: 2, marginHorizontal: 3, marginBottom: 17 },
});
