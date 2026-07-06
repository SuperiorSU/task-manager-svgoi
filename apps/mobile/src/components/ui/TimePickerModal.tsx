import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { AppColors } from '../../constants/colors';

// Shared drum/stepper time picker — originally built for the Create Task due-time
// field (apps/mobile/app/(app)/tasks/create.tsx) and lifted here so any other
// screen needing a time value (e.g. quiet hours) uses the same interaction and
// look instead of introducing a different picker pattern.

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type TimePickerModalProps = {
  visible: boolean;
  hour: number; // 1-12
  minute: number;
  isAfternoon: boolean;
  onConfirm: (hour: number, minute: number, isAfternoon: boolean) => void;
  onClose: () => void;
  colors: AppColors;
  title?: string;
};

export function TimePickerModal({
  visible,
  hour,
  minute,
  isAfternoon,
  onConfirm,
  onClose,
  colors: C,
  title = 'Select Time',
}: TimePickerModalProps) {
  const [draftHour, setDraftHour] = useState(hour);
  const [draftMin, setDraftMin] = useState(minute);
  const [draftPm, setDraftPm] = useState(isAfternoon);

  useEffect(() => {
    if (visible) {
      setDraftHour(hour);
      setDraftMin(minute);
      setDraftPm(isAfternoon);
    }
  }, [visible, hour, minute, isAfternoon]);

  const stepHour = (delta: number) =>
    setDraftHour((h) => {
      let next = h + delta;
      if (next < 1) next = 12;
      if (next > 12) next = 1;
      return next;
    });

  const stepMin = (delta: number) =>
    setDraftMin((m) => {
      const idx = MINUTE_STEPS.indexOf(m);
      let nextIdx = idx + delta;
      if (nextIdx < 0) nextIdx = MINUTE_STEPS.length - 1;
      if (nextIdx >= MINUTE_STEPS.length) nextIdx = 0;
      return MINUTE_STEPS[nextIdx] ?? 0;
    });

  const label = `${draftHour}:${String(draftMin).padStart(2, '0')} ${draftPm ? 'PM' : 'AM'}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: C.surface.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[s.handle, { backgroundColor: C.surface.border }]} />
          <Text style={[s.title, { color: C.text.primary }]}>{title}</Text>

          <View style={s.picker}>
            <DrumColumn label="Hour" value={String(draftHour)} onUp={() => stepHour(1)} onDown={() => stepHour(-1)} C={C} />
            <Text style={[s.sep, { color: C.text.primary }]}>:</Text>
            <DrumColumn
              label="Min"
              value={String(draftMin).padStart(2, '0')}
              onUp={() => stepMin(1)}
              onDown={() => stepMin(-1)}
              C={C}
            />
            <View style={s.ampmCol}>
              <Text style={[s.drumLabel, { color: C.text.tertiary }]}>Period</Text>
              <Pressable
                onPress={() => { void Haptics.selectionAsync(); setDraftPm((v) => !v); }}
                style={[s.ampmToggle, { borderColor: C.brand.primary, backgroundColor: C.brand.primaryLight }]}
                accessibilityRole="button"
                accessibilityLabel={draftPm ? 'PM, tap to switch to AM' : 'AM, tap to switch to PM'}
              >
                <Text style={[s.ampmText, { color: C.brand.primary }]}>{draftPm ? 'PM' : 'AM'}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => onConfirm(draftHour, draftMin, draftPm)}
            style={[s.confirmBtn, { backgroundColor: C.brand.primary }]}
            accessibilityRole="button"
            accessibilityLabel={`Confirm time ${label}`}
          >
            <Text style={s.confirmText}>Confirm — {label}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DrumColumn({
  label, value, onUp, onDown, C,
}: { label: string; value: string; onUp: () => void; onDown: () => void; C: AppColors }) {
  return (
    <View style={s.drumCol}>
      <Text style={[s.drumLabel, { color: C.text.tertiary }]}>{label}</Text>
      <Pressable
        onPress={() => { void Haptics.selectionAsync(); onUp(); }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
      >
        <Feather name="chevron-up" size={22} color={C.brand.primary} />
      </Pressable>
      <View style={[s.drumValueBox, { borderColor: C.surface.border, backgroundColor: C.surface.background }]}>
        <Text style={[s.drumValue, { color: C.text.primary }]}>{value}</Text>
      </View>
      <Pressable
        onPress={() => { void Haptics.selectionAsync(); onDown(); }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
      >
        <Feather name="chevron-down" size={22} color={C.brand.primary} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center', marginBottom: 18 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 },
  sep: { fontSize: 22, fontFamily: 'Inter-SemiBold', marginTop: 22 },
  drumCol: { alignItems: 'center', gap: 8 },
  drumLabel: { fontSize: 11, fontFamily: 'Inter-Medium', textTransform: 'uppercase', letterSpacing: 0.4 },
  drumValueBox: {
    width: 56,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumValue: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  ampmCol: { alignItems: 'center', gap: 8 },
  ampmToggle: { width: 56, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ampmText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  confirmBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontSize: 15, fontFamily: 'Inter-SemiBold' },
});
