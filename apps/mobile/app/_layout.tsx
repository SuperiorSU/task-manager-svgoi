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
import { useThemeStore } from '../src/stores/theme.store';
import { useNetworkState } from '../src/hooks/useNetworkState';
import { useIsDark } from '../src/constants/colors';

SplashScreen.preventAutoHideAsync();

initApi();

const Root = () => {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const isHydrated = !useAuthStore((s) => s.isLoading);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const isDark = useIsDark();
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
