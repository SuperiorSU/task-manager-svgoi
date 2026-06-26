import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../src/stores/auth.store';

export default function RootIndex() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  // Use useEffect so this only fires when values actually change,
  // not on every render. <Redirect> fires during render and can repeat
  // if the parent re-renders for any reason (network state, etc.).
  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? '/(app)/(tabs)' : '/(auth)/login');
  }, [isLoading, user]);

  return null;
}
