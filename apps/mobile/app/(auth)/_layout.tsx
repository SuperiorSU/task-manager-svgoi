import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';

import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/auth.store';
import { getHomeRoute } from '../../src/utils/roleRoute';

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Navigate away AFTER render — never swap Stack for Redirect mid-render.
  // Swapping causes the entire Stack tree to unmount (TextInputs lose focus,
  // keyboard dismisses, both inputs flash cursor on remount).
  useEffect(() => {
    if (user) router.replace(getHomeRoute(user.role));
  }, [user]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.surface.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="forgot-password"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="terms"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
