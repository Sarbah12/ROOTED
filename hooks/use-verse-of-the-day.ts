import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getVerseOfTheDay, type DailyVerse } from '@/constants/verse-of-the-day';

/**
 * Today's verse, and still today's verse tomorrow.
 *
 * The home screen used to compute this with `useMemo(..., [])`, which reads as
 * "work it out once" and is wrong on a phone: apps are backgrounded, not
 * closed, so the screen stays mounted for days and the verse froze on whatever
 * day you first opened it. You would only ever see it change by force-quitting.
 *
 * Two things move a day forward, and both are handled:
 *
 *   - Coming back to the app after midnight. Checked on every foreground,
 *     which is cheap and catches the ordinary case.
 *   - Midnight passing while the app is open and being read. A timer fires at
 *     the next local midnight, so someone reading at 23:59 sees it turn over.
 */

/** Local calendar day, which is what the verse actually keys on. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  // A second past, so the new day has definitely started when it fires.
  return midnight.getTime() - now.getTime() + 1000;
}

export function useVerseOfTheDay(): DailyVerse {
  const [state, setState] = useState(() => ({ day: today(), verse: getVerseOfTheDay() }));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const refresh = () => {
      const day = today();
      // Only replace it when the day has actually changed, so a foreground
      // does not re-render the screen for nothing.
      setState((prev) => (prev.day === day ? prev : { day, verse: getVerseOfTheDay() }));
    };

    const scheduleMidnight = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, msUntilMidnight());
    };

    scheduleMidnight();

    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      refresh();
      // A backgrounded timer is unreliable, so it is rebuilt on every return.
      scheduleMidnight();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return state.verse;
}
