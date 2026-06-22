import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '../../src/stores/auth.store';

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
