import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getVerseOfTheDay } from '@/constants/verse-of-the-day';

/**
 * Daily reading reminders and the verse of the day.
 *
 * A repeating DAILY trigger carries one fixed body, so the same verse would
 * arrive every morning forever. Instead this schedules a rolling window of
 * individual dated notifications, each carrying that day's verse, and tops the
 * window back up every time the app opens.
 *
 * Local notifications only: they fire from the device on a schedule, so no
 * push certificate or server is involved.
 */

const REMINDER_ID = 'rooted-daily-reading';
const VERSE_ID = 'rooted-daily-verse';

/**
 * How far ahead to schedule. iOS keeps at most 64 pending local notifications,
 * and this uses two per day, so 14 days sits comfortably inside that.
 */
const WINDOW_DAYS = 14;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Varied so the nudge does not read like the same robot every morning. */
const READING_PROMPTS = [
  { title: 'Time to read', body: 'A few minutes in the Word today.' },
  { title: 'Your reading is waiting', body: 'Pick up where you left off.' },
  { title: 'A moment in Scripture', body: 'Even a short passage counts.' },
  { title: 'Back to the Word', body: 'Today’s reading is ready when you are.' },
  { title: 'Keep your streak', body: 'One chapter is enough to keep going.' },
  { title: 'Time with God', body: 'Open Rooted and read a little.' },
  { title: 'Today’s reading', body: 'A few quiet minutes in Scripture.' },
];

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

async function cancelOurs() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => {
        const id = item.content.data?.id;
        return id === REMINDER_ID || id === VERSE_ID;
      })
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

/** The next occurrence of hour:minute on `dayOffset` days from today. */
function occurrence(dayOffset: number, hour: number, minute: number) {
  const when = new Date();
  when.setDate(when.getDate() + dayOffset);
  when.setHours(hour, minute, 0, 0);
  return when;
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
   * Re-applies the whole schedule from the current settings. Called on every
   * change and on launch, so there is one code path and the rolling window
   * refills itself as days pass.
   */
  const sync = useCallback(
    async (settings: {
      remindersEnabled: boolean;
      verseNotificationsEnabled: boolean;
      reminderTime: string;
    }) => {
      // Notifications are unavailable on web.
      if (Platform.OS === 'web') return;

      const wanted = settings.remindersEnabled || settings.verseNotificationsEnabled;

      if (!wanted) {
        await cancelOurs();
        return;
      }

      const allowed = await ensurePermission();
      setPermission(allowed ? 'granted' : 'denied');
      if (!allowed) return;

      // Clear the old window before laying down a fresh one, so re-running does
      // not stack duplicates.
      await cancelOurs();

      const { hour, minute } = parseReminderTime(settings.reminderTime);
      const now = Date.now();

      for (let offset = 0; offset <= WINDOW_DAYS; offset += 1) {
        if (settings.remindersEnabled) {
          const when = occurrence(offset, hour, minute);
          // Today's slot may already have passed.
          if (when.getTime() > now) {
            const prompt = READING_PROMPTS[
              Math.floor(when.getTime() / 86_400_000) % READING_PROMPTS.length
            ];
            await Notifications.scheduleNotificationAsync({
              content: { title: prompt.title, body: prompt.body, data: { id: REMINDER_ID } },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
            });
          }
        }

        if (settings.verseNotificationsEnabled) {
          // An hour after the reading nudge, so the two do not arrive together.
          const when = occurrence(offset, (hour + 1) % 24, minute);
          if (when.getTime() > now) {
            // The verse for that specific day, not today's repeated forever.
            const verse = getVerseOfTheDay(when);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Verse of the day — ${verse.reference}`,
                body: verse.text.replace(/[“”]/g, '').slice(0, 140),
                data: { id: VERSE_ID },
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
            });
          }
        }
      }
    },
    [],
  );

  /** Exposed for a settings screen that wants to show what is queued. */
  const pendingCount = useCallback(async () => {
    if (Platform.OS === 'web') return 0;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter((item) => {
      const id = item.content.data?.id;
      return id === REMINDER_ID || id === VERSE_ID;
    }).length;
  }, []);

  return { permission, sync, pendingCount };
}
