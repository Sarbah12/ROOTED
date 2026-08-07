import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { BACKEND_API_BASE_URL } from '@/constants/firebase';
import { useFirebaseAuth } from '@/context/firebase-auth';
import { useReminders } from '@/hooks/use-reminders';

/**
 * User settings, persisted on device and mirrored to /v1/me/settings when
 * signed in. Local is authoritative: a toggle must survive an app restart
 * whether or not the backend is reachable.
 */

export type AppSettings = {
  darkMode: boolean;
  remindersEnabled: boolean;
  verseNotificationsEnabled: boolean;
  streakBadgeEnabled: boolean;
  reminderTime: string;
  fontSize: string;
};

const STORAGE_KEY = 'rooted:settings:v1';

const DEFAULTS: AppSettings = {
  darkMode: false,
  remindersEnabled: true,
  verseNotificationsEnabled: true,
  streakBadgeEnabled: false,
  reminderTime: '7:00 AM',
  fontSize: 'Default',
};

type AppSettingsContextValue = {
  settings: AppSettings;
  isLoaded: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  // Kept so existing `useThemeMode()` callers keep working unchanged.
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { idToken, isReady } = useFirebaseAuth();
  const { sync: syncReminders } = useReminders();

  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);
  const settingsRef = useRef<AppSettings>(DEFAULTS);
  // Only follow the system theme until the user expresses a preference.
  const hasStoredPreference = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let stored: Partial<AppSettings> | null = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        stored = raw ? (JSON.parse(raw) as Partial<AppSettings>) : null;
      } catch {
        stored = null;
      }
      if (!active) return;

      const next: AppSettings = {
        ...DEFAULTS,
        darkMode: systemColorScheme === 'dark',
        ...(stored ?? {}),
      };

      hasStoredPreference.current = stored !== null;
      settingsRef.current = next;
      setSettings(next);
      setIsLoaded(true);
    })();
    return () => {
      active = false;
    };
    // Deliberately runs once: later system changes must not clobber a choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the system theme only while the user has not chosen one.
  useEffect(() => {
    if (!isLoaded || hasStoredPreference.current) return;
    const next = { ...settingsRef.current, darkMode: systemColorScheme === 'dark' };
    settingsRef.current = next;
    setSettings(next);
  }, [systemColorScheme, isLoaded]);

  const persist = useCallback(
    (next: AppSettings) => {
      settingsRef.current = next;
      setSettings(next);

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // Best-effort; the in-memory value still drives the UI.
      });

      // Reminder settings only mean something once notifications are actually
      // scheduled; this is what makes the toggles do anything.
      void syncReminders({
        remindersEnabled: next.remindersEnabled,
        verseNotificationsEnabled: next.verseNotificationsEnabled,
        reminderTime: next.reminderTime,
      });

      if (!idToken) return;

      // Fire-and-forget: a failed sync must not undo the local change.
      fetch(`${BACKEND_API_BASE_URL}/v1/me/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(next),
      }).catch(() => {});
    },
    [idToken, syncReminders],
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      if (patch.darkMode !== undefined) {
        hasStoredPreference.current = true;
      }
      persist({ ...settingsRef.current, ...patch });
    },
    [persist],
  );

  // Pull remote settings once signed in, so a new device picks them up.
  useEffect(() => {
    if (!isReady || !idToken || !isLoaded) return;

    let active = true;
    (async () => {
      try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/v1/me/settings`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) return;

        const remote = (await response.json()) as Partial<AppSettings>;
        if (!active || !remote) return;

        const merged = { ...settingsRef.current, ...remote };
        settingsRef.current = merged;
        setSettings(merged);
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Offline or backend down — local settings stand.
      }
    })();

    return () => {
      active = false;
    };
  }, [isReady, idToken, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    void syncReminders({
      remindersEnabled: settings.remindersEnabled,
      verseNotificationsEnabled: settings.verseNotificationsEnabled,
      reminderTime: settings.reminderTime,
    });
    // Re-applied on launch so a reinstall or OS clear-out restores the schedule.
  }, [isLoaded, settings.remindersEnabled, settings.verseNotificationsEnabled,
      settings.reminderTime, syncReminders]);

  const setIsDarkMode = useCallback(
    (value: boolean) => updateSettings({ darkMode: value }),
    [updateSettings],
  );

  const value = useMemo(
    () => ({
      settings,
      isLoaded,
      updateSettings,
      isDarkMode: settings.darkMode,
      setIsDarkMode,
    }),
    [settings, isLoaded, updateSettings, setIsDarkMode],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
