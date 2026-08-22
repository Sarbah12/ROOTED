import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { ALL_TRANSLATIONS } from '@/constants/bible-translations';

/**
 * The version chosen for plan readings, remembered between days.
 *
 * Kept separate from the Bible tab's own selection on purpose: someone may
 * read a plan in NKJV while studying in KJV, and having one silently change
 * the other would be surprising. It is remembered so the choice is made once
 * rather than every day.
 */

const KEY = 'rooted:reading-translation:v1';
const DEFAULT_ID = 'kjv';

export function useReadingTranslation(): [string, (id: string) => void] {
  const [id, setId] = useState(DEFAULT_ID);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        // A stored id can outlive the translation it names — a version removed
        // in an update would otherwise leave the reader stuck on nothing.
        if (active && stored && ALL_TRANSLATIONS.some((t) => t.id === stored)) setId(stored);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const choose = useCallback((next: string) => {
    setId(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  return [id, choose];
}
