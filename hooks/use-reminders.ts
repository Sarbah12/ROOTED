import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getVerseOfTheDay } from '@/constants/verse-of-the-day';

/**
 * Daily reading reminders.
 *
 * The settings screen has offered a reminders toggle and a time picker since
 * the beginning, but nothing was ever scheduled — the switches persisted and
 * synced, and did nothing. This wires them to real local notifications.
 *
 * Local notifications only: they fire from the device on a schedule, so no
 * push certificate or server is involved.
 */

const REMINDER_ID = 'rooted-daily-reading';
const VERSE_ID = 'rooted-daily-verse';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** "7:00 AM" -> { hour: 7, minute: 0 } */
export function parseReminderTime(value: string): { hour: number; minute: number } {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { hour: 7, minute: 0 };

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return { hour: Math.min(23, hour), minute: Math.min(59, minute) };
}

async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  // Do not re-prompt once the user has explicitly said no.
  if (!existing.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancel(identifier: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.id === identifier)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export function useReminders() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');

  useEffect(() => {
    let active = true;
    Notifications.getPermissionsAsync()
      .then((status) => {
        if (active) setPermission(status.granted ? 'granted' : 'denied');
      })
      .catch(() => {
        if (active) setPermission('denied');
      });
    return () => {
      active = false;
    };
  }, []);

  /**
   * Re-applies the whole schedule from the current settings. Called after any
   * change, so there is one code path rather than separate add/remove logic.
   */
  const sync = useCallback(
    async (settings: {
      remindersEnabled: boolean;
      verseNotificationsEnabled: boolean;
      reminderTime: string;
    }) => {
      // Notifications are unavailable in Expo Go on Android and on web.
      if (Platform.OS === 'web') return;

      const wanted = settings.remindersEnabled || settings.verseNotificationsEnabled;

      if (!wanted) {
        await cancel(REMINDER_ID);
        await cancel(VERSE_ID);
        return;
      }

      const allowed = await ensurePermission();
      setPermission(allowed ? 'granted' : 'denied');
      if (!allowed) return;

      const { hour, minute } = parseReminderTime(settings.reminderTime);

      await cancel(REMINDER_ID);
      if (settings.remindersEnabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time to read',
            body: 'A few minutes in the Word today.',
            data: { id: REMINDER_ID },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
      }

      await cancel(VERSE_ID);
      if (settings.verseNotificationsEnabled) {
        const verse = getVerseOfTheDay();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Verse of the day — ${verse.reference}`,
            // Trim so the banner is not a wall of text.
            body: verse.text.replace(/[“”]/g, '').slice(0, 140),
            data: { id: VERSE_ID },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            // An hour after the reading nudge, so they do not stack.
            hour: (hour + 1) % 24,
            minute,
          },
        });
      }
    },
    [],
  );

  return { permission, sync };
}
