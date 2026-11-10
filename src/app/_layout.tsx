import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Splash } from '@/components/Shell';
import { AppStateProvider, useApp } from '@/state/app';
import { BookingProvider } from '@/state/booking';
import { DataProvider } from '@/state/data';
import { NotificationSync } from '@/state/NotificationSync';
import { ToastProvider } from '@/state/toast';
import { brand, ThemeProvider, useTheme } from '@/theme';
import { fontAssets } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(brand.pitch).catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <Themed fontsLoaded={fontsLoaded} />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

function Themed({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { themePref } = useApp();
  return (
    <ThemeProvider pref={themePref}>
      <ToastProvider>
        <DataProvider>
          <BookingProvider>
            <Root fontsLoaded={fontsLoaded} />
          </BookingProvider>
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function Root({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, club } = useApp();
  const { c } = useTheme();
  const [splash, setSplash] = useState(true);
  const loaded = ready && fontsLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: brand.pitch }} />;

  return (
    <View style={{ flex: 1, backgroundColor: brand.pitch }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        {/* No home club yet: first-launch setup is the only screen. */}
        <Stack.Protected guard={!club}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade', contentStyle: { backgroundColor: brand.pitch } }} />
        </Stack.Protected>
        <Stack.Protected guard={!!club}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="switch-club" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          <Stack.Screen name="checkout" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="booking/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bond-id/[member]" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
      <NotificationSync />
      {splash ? <Splash onDone={() => setSplash(false)} /> : null}
    </View>
  );
}
