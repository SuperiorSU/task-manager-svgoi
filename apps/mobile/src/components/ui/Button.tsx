import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useColors } from '../../constants/colors';
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
    const colors = useColors();

    const handlePress = async (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    };

    const variantStyles = {
      primary: {
        bg: colors.brand.primary,
        bgPressed: colors.brand.primaryDark,
        labelColor: colors.text.inverse,
      },
      secondary: {
        bg: 'transparent',
        bgPressed: colors.brand.primaryLight,
        labelColor: colors.brand.primary,
      },
      danger: {
        bg: colors.semantic.error,
        bgPressed: '#DC2626',
        labelColor: colors.text.inverse,
      },
      ghost: {
        bg: 'transparent',
        bgPressed: colors.brand.primaryLight,
        labelColor: colors.brand.primary,
      },
    }[variant];

    return (
      <Pressable
        {...rest}
        onPress={handlePress}
        disabled={disabled ?? loading}
        style={({ pressed }) => [
          s.base,
          { backgroundColor: pressed ? variantStyles.bgPressed : variantStyles.bg },
          variant === 'secondary' && s.secondaryBorder,
          variant === 'secondary' && { borderColor: colors.brand.primary },
          fullWidth && s.fullWidth,
          (disabled ?? loading) && s.disabled,
          style as object,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' ? colors.text.inverse : colors.brand.primary}
          />
        ) : (
          <Text style={[s.labelText, { color: variantStyles.labelColor }]}>{label}</Text>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

const s = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  secondaryBorder: { borderWidth: 1.5 },
  labelText: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
  },
});
