import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/spacing';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = React.memo(
  ({ label, variant = 'primary', loading, fullWidth, disabled, onPress, style, ...rest }: Props) => {
    const handlePress = async (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    };

    return (
      <Pressable
        {...rest}
        onPress={handlePress}
        disabled={disabled ?? loading}
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          fullWidth && styles.fullWidth,
          (disabled ?? loading) && styles.disabled,
          pressed && styles[`${variant}Pressed`],
          style as object,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' ? Colors.text.inverse : Colors.brand.primary}
          />
        ) : (
          <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  primary: { backgroundColor: Colors.brand.primary },
  primaryLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: Colors.text.inverse },
  primaryPressed: { backgroundColor: Colors.brand.primaryDark },

  secondary: { borderWidth: 1.5, borderColor: Colors.brand.primary, backgroundColor: 'transparent' },
  secondaryLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: Colors.brand.primary },
  secondaryPressed: { backgroundColor: Colors.brand.primaryLight },

  danger: { backgroundColor: Colors.semantic.error },
  dangerLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: Colors.text.inverse },
  dangerPressed: { backgroundColor: '#DC2626' },

  ghost: { backgroundColor: 'transparent' },
  ghostLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: Colors.brand.primary },
  ghostPressed: { backgroundColor: Colors.brand.primaryLight },
});
