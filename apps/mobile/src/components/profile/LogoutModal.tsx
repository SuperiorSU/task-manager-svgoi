import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Props = {
  visible: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const LogoutModal = React.memo(({ visible, isPending, onConfirm, onCancel }: Props) => {
  const colors = useColors();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={[s.dialog, { backgroundColor: colors.surface.card }]}>
          <View style={s.iconCircle}>
            <Feather name="log-out" size={28} color="#DC2626" />
          </View>

          <Text style={[s.title, { color: colors.text.primary }]}>Log out?</Text>
          <Text style={[s.body, { color: colors.text.secondary }]}>
            You'll need your Employee ID and password to sign back in.
          </Text>

          <View style={s.btnCol}>
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              style={({ pressed }) => [s.btnRed, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.btnRedLabel}>Log out</Text>
              )}
            </Pressable>

            <Pressable
              onPress={onCancel}
              disabled={isPending}
              style={({ pressed }) => [
                s.btnCancel,
                { borderColor: colors.surface.border },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
            >
              <Text style={[s.btnCancelLabel, { color: colors.text.secondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

LogoutModal.displayName = 'LogoutModal';

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 13.5,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  btnCol: {
    width: '100%',
    gap: 10,
    marginTop: 22,
  },
  btnRed: {
    height: 50,
    backgroundColor: '#DC2626',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRedLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  btnCancel: {
    height: 50,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});
