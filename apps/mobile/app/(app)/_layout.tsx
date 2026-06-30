import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';

import { useAuthStore } from '../../src/stores/auth.store';
import { useSocket } from '../../src/hooks/useSocket';

function SocketInitializer() {
  useSocket();
  return null;
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/(auth)/login');
  }, [user]);

  return (
    <>
      {user && <SocketInitializer />}
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(sa)" />
        <Stack.Screen name="tasks/[id]" />
        <Stack.Screen name="tasks/create" />
        <Stack.Screen name="tasks/[id]/comments" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/change-password" />
        <Stack.Screen name="profile/notifications" />
        <Stack.Screen name="profile/appearance" />
        <Stack.Screen name="profile/help" />
      </Stack>
    </>
  );
}
