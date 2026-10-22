import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { PlusJakartaSans_300Light, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { I18nManager, Platform, useColorScheme } from 'react-native';

import { AlarmsProvider } from '@/context/alarms';
import { LocationProvider } from '@/context/location';
import { PhaseProvider } from '@/context/phase';
import { configureNotifications } from '@/lib/alarms';
import { IS_RTL, LOCALE } from '@/lib/i18n';

// Arabic mirrors the layout: native follows the system direction; web gets it from the document.
I18nManager.allowRTL(true);
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = IS_RTL ? 'rtl' : 'ltr';
  document.documentElement.lang = LOCALE;
}

SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocationProvider>
        <PhaseProvider>
          <AlarmsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="location" options={{ presentation: 'modal' }} />
            </Stack>
          </AlarmsProvider>
        </PhaseProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}