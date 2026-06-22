import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '../../src/stores/auth.store';
import { useSocket } from '../../src/hooks/useSocket';

function SocketInitializer() {
  useSocket();
  return null;
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <SocketInitializer />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tasks/[id]" />
        <Stack.Screen name="tasks/create" />
        <Stack.Screen name="tasks/[id]/comments" />
        <Stack.Screen name="notifications" />
      </Stack>
    </>
  );
}
