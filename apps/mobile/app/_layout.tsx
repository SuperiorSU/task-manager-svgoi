import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
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
import { useNetworkState } from '../src/hooks/useNetworkState';

SplashScreen.preventAutoHideAsync();

initApi();

const Root = () => {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isHydrated = !useAuthStore((s) => s.isLoading);
  useNetworkState();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated]);

  if (!fontsLoaded || !isHydrated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/*
          The app is always light mode (white backgrounds). Force dark icons so
          the time/battery/notifications are always visible against the white header,
          even when the device OS is in dark mode.
          translucent + transparent lets the header colour show through on Android.
        */}
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <QueryClientProvider client={queryClient}>
          <Root />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
