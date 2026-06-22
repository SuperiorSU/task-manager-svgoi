import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { Spacing } from '../../src/constants/spacing';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useLogin } from '../../src/hooks/useAuth';
import { getErrorMessage } from '../../src/utils/errorHandler';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { mutate: login, isPending, error } = useLogin();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: '', password: '' },
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>SVGOI</Text>
        </View>
        <Text style={styles.appName}>TaskFlow</Text>
        <Text style={styles.tagline}>Sri Vishwakarma Group of Institutions</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in with your employee credentials</Text>

        <Controller
          control={control}
          name="employeeId"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Employee ID"
              placeholder="e.g. CS001"
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.employeeId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              secureToggle
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
          </View>
        )}

        <Button
          label={isPending ? 'Signing in...' : 'Sign In'}
          loading={isPending}
          fullWidth
          onPress={handleSubmit((data) => login(data))}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.surface.background,
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[12],
  },
  logoSection: { alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[10] },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { ...Typography.h4, fontFamily: 'Inter-Bold', color: Colors.text.inverse },
  appName: { ...Typography.displaySm, fontFamily: 'Inter-Bold', color: Colors.text.primary },
  tagline: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary, textAlign: 'center' },
  form: { gap: Spacing[5] },
  heading: { ...Typography.h2, fontFamily: 'Inter-Bold', color: Colors.text.primary },
  subheading: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary },
  errorBox: {
    backgroundColor: Colors.semantic.errorBg,
    borderRadius: 8,
    padding: Spacing[4],
  },
  errorText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.semantic.error },
});
