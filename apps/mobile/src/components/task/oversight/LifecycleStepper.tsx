import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { MockTask } from '../../../data/tasks.mock';
import { useColors } from '../../../constants/colors';

const STEPS: { key: MockTask['status']; label: string }[] = [
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'UNDER_REVIEW', label: 'Review' },
  { key: 'COMPLETED', label: 'Approved' },
];

const STEP_ORDER: Record<MockTask['status'], number> = {
  PENDING: 0,
  ACCEPTED: 1,
  IN_PROGRESS: 2,
  UNDER_REVIEW: 3,
  COMPLETED: 4,
  CANCELLED: 4,
};

type Props = { status: MockTask['status'] };

// Governance task tracking progress rail (screen 63) — 4-step lifecycle
// distinct from TaskActivityTimeline (which lists individual events, not the
// overall stage). Built fresh since no equivalent stepper exists elsewhere.
export const LifecycleStepper = React.memo(({ status }: Props) => {
  const colors = useColors();
  const currentIndex = STEP_ORDER[status];

  return (
    <View style={styles.row}>
      {STEPS.map((step, idx) => {
        const stepIndex = idx + 1;
        const done = stepIndex < currentIndex;
        const active = stepIndex === currentIndex;
        const isLast = idx === STEPS.length - 1;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.dot,
                  done && { backgroundColor: colors.brand.primary },
                  active && { backgroundColor: '#F5F3FF', borderWidth: 2, borderColor: '#7C3AED' },
                  !done && !active && { backgroundColor: colors.surface.card, borderWidth: 2, borderColor: colors.surface.border },
                ]}
              >
                {done && <Feather name="check" size={13} color="#FFFFFF" />}
                {active && <View style={styles.activeInnerDot} />}
                {!done && !active && <Feather name="check" size={12} color={colors.surface.borderStrong} />}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: done ? colors.brand.primary : active ? '#6D28D9' : colors.text.tertiary },
                  (done || active) && styles.labelActive,
                ]}
              >
                {step.label}
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
  activeInnerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED' },
  label: { fontSize: 9.5, fontFamily: 'Inter-Medium' },
  labelActive: { fontFamily: 'Inter-SemiBold' },
  connector: { flex: 1, height: 2, marginHorizontal: 3, marginBottom: 17 },
});
