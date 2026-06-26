import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, type TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Props = TextInputProps & {
  label?: string | undefined;
  error?: string | undefined;
  secureToggle?: boolean;
};

export const Input = React.memo(({ label, error, secureToggle, style, ...rest }: Props) => {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureToggle ?? false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          style={[styles.input, style]}
          placeholderTextColor={Colors.text.tertiary}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          accessibilityLabel={label}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={Colors.text.tertiary} />
          </Pressable>
        )}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color={Colors.semantic.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { gap: Spacing[2] },
  label: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', color: Colors.text.secondary },
  inputWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    borderRadius: Layout.inputRadius,
    borderWidth: 1.5,
    borderColor: Colors.surface.border,
    backgroundColor: Colors.surface.card,
    gap: Spacing[2],
  },
  input: {
    flex: 1,
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
  },
  inputFocused: {
    borderColor: Colors.brand.primary,
    // iOS: soft glow ring — safe, no native layer change
    // Android: skip elevation entirely — toggling elevation detaches the child
    // TextInput from the Android view hierarchy (fires onBlur, dismisses keyboard)
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
  },
  inputError: { borderColor: Colors.semantic.error },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  errorText: { ...Typography.caption, fontFamily: 'Inter-Regular', color: Colors.semantic.error },
});
