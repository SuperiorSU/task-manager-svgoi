import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { usersApi } from '@godigitify/api-client';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { queryClient } from '../src/utils/queryClient';
import { initApi } from '../src/services/api.service';
import { useAuthStore } from '../src/stores/auth.store';
import { useThemeStore } from '../src/stores/theme.store';
import { useNotificationStore } from '../src/stores/notification.store';
import { useNetworkState } from '../src/hooks/useNetworkState';
import { useIsDark } from '../src/constants/colors';
import { Toast } from '../src/components/ui/Toast';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  removeNotificationSubscription,
} from '../src/services/notification.service';

SplashScreen.preventAutoHideAsync();

initApi();

const Root = () => {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isHydrated = !useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const isDark = useIsDark();
  const router = useRouter();
  useNetworkState();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    hydrateFromStorage();
    hydrateTheme();
  }, [hydrateFromStorage, hydrateTheme]);

  useEffect(() => {
    if (fontsLoaded && isHydrated && themeHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated, themeHydrated]);

  // Covers the returning-session case (app relaunch with a stored session) —
  // fresh logins register their token in useLogin's onSuccess instead.
  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    registerForPushNotifications()
      .then((token) => {
        if (!token) return undefined;
        return usersApi.registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
      })
      .catch(() => {
        // Push is a convenience feature — a permission denial must never block app usage.
      });
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    const receivedSub = addNotificationReceivedListener(() => {
      useNotificationStore.getState().incrementUnread();
    });
    const responseSub = addNotificationResponseListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (typeof screen === 'string') router.push(screen as never);
    });
    return () => {
      removeNotificationSubscription(receivedSub);
      removeNotificationSubscription(responseSub);
    };
  }, [router]);

  if (!fontsLoaded || !isHydrated || !themeHydrated) return null;

  return (
    <>
      {/* StatusBar icon style flips between dark (light bg) and light (dark bg) */}
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Toast />
    </>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Root />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
