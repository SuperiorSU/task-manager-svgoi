import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';

import { useAuthStore } from '../../src/stores/auth.store';
import { useSocket } from '../../src/hooks/useSocket';
import { useUnreadCount } from '../../src/hooks/useNotifications';
import { getHomeRoute } from '../../src/utils/roleRoute';

function SocketInitializer() {
  useSocket();
  return null;
}

// Keeps the tab-bar unread badge live from app boot (not just while the
// Notifications screen is mounted) — polls GET /notifications/unread-count
// every 60s per useUnreadCount's refetchInterval.
function UnreadCountInitializer() {
  useUnreadCount();
  return null;
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const lastRole = useRef(user?.role);

  useEffect(() => {
    if (!user) router.replace('/(auth)/login');
  }, [user]);

  // A role change mid-session (e.g. the SA promotes/demotes this user while
  // they're logged in and their profile refetches) isn't a login transition,
  // so the effect above never fires for it — without this, screens from the
  // old role's tab group ((tabs)/(admin)/(sa)) could stay reachable in
  // navigation history under the new role.
  useEffect(() => {
    if (user && lastRole.current && user.role !== lastRole.current) {
      router.replace(getHomeRoute(user.role));
    }
    lastRole.current = user?.role;
  }, [user, router]);

  return (
    <>
      {user && <SocketInitializer />}
      {user && <UnreadCountInitializer />}
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(sa)" />
        <Stack.Screen name="tasks/[id]" />
        <Stack.Screen name="tasks/create" />
        <Stack.Screen name="tasks/[id]/comments" />
        <Stack.Screen name="tasks/review/[id]" />
        <Stack.Screen name="tasks/batch/[batchId]" />
        <Stack.Screen name="tasks/batch/[batchId]/member/[taskId]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/change-password" />
        <Stack.Screen name="profile/notifications" />
        <Stack.Screen name="profile/appearance" />
        <Stack.Screen name="profile/help" />
        <Stack.Screen name="profile/terms" />
        <Stack.Screen name="people/[id]" />
        <Stack.Screen name="people/create" />
        <Stack.Screen name="people/[id]/edit" />
      </Stack>
    </>
  );
}
