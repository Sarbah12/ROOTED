import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { FirebaseAuthProvider } from '@/context/firebase-auth';
import { ThemeModeProvider, useThemeMode } from '@/context/theme-mode';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutShell() {
  const { isDarkMode } = useThemeMode();
  const colorScheme = isDarkMode ? 'dark' : 'light';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor:
              colorScheme === 'dark' ? APP_THEMES.dark.background : APP_THEMES.light.background,
          },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Settings read the auth token to sync, so they nest inside auth. */}
      <FirebaseAuthProvider>
        <ThemeModeProvider>
          <RootLayoutShell />
        </ThemeModeProvider>
      </FirebaseAuthProvider>
    </SafeAreaProvider>
  );
}
