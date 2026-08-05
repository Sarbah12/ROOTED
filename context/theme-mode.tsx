/**
 * Theme state now lives in the wider settings context so it survives restarts
 * and syncs with the backend. This shim keeps the original `useThemeMode()`
 * call sites working unchanged.
 */
import { AppSettingsProvider, useAppSettings } from '@/context/app-settings';

export { AppSettingsProvider as ThemeModeProvider, useAppSettings };

export function useThemeMode() {
  const { isDarkMode, setIsDarkMode } = useAppSettings();
  return { isDarkMode, setIsDarkMode };
}
