import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

import { BIBLE_BOOKS_BY_ID } from '@/constants/bible-books';
import { getOfflineChapter } from '@/constants/bible-offline';
import { getTranslation } from '@/constants/bible-translations';

export type ChapterVerse = {
  verse: number;
  text: string;
};

export type ChapterState = {
  verses: ChapterVerse[];
  loading: boolean;
  /** User-facing message; null when the chapter loaded fine. */
  error: string | null;
  /** Where the text came from, for the "offline" badge in the UI. */
  origin: 'offline' | 'network' | 'cache' | null;
};

const API_BASE = 'https://bible-api.com';
const CACHE_PREFIX = 'bible:v1:';

function cacheKey(translationId: string, bookId: string, chapter: number) {
  return `${CACHE_PREFIX}${translationId}:${bookId}:${chapter}`;
}

function toVerses(texts: string[]): ChapterVerse[] {
  return texts.map((text, index) => ({ verse: index + 1, text }));
}

async function readCache(key: string): Promise<ChapterVerse[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ChapterVerse[]) : null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, verses: ChapterVerse[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(verses));
  } catch {
    // A cache write failure should never break reading.
  }
}

async function fetchChapter(
  apiId: string,
  bookName: string,
  chapter: number,
  signal: AbortSignal
): Promise<ChapterVerse[]> {
  const reference = encodeURIComponent(`${bookName} ${chapter}`);
  const response = await fetch(`${API_BASE}/${reference}?translation=${apiId}`, { signal });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data?.verses?.length) {
    throw new Error(data?.error || 'No verses returned');
  }

  return data.verses.map((item: { verse: number; text: string }) => ({
    verse: item.verse,
    text: String(item.text).replace(/\s+/g, ' ').trim(),
  }));
}

/**
 * Loads a chapter for the given translation.
 *
 * Bundled translations resolve synchronously on first render. Remote ones show
 * cached text immediately when available, then fall back to the network.
 */
export function useChapter(
  translationId: string,
  bookId: string,
  chapter: number
): ChapterState {
  const translation = getTranslation(translationId);
  const book = BIBLE_BOOKS_BY_ID[bookId];

  const offlineVerses =
    translation.source === 'offline' ? getOfflineChapter(bookId, chapter) : null;

  const [state, setState] = useState<ChapterState>(() =>
    offlineVerses
      ? { verses: toVerses(offlineVerses), loading: false, error: null, origin: 'offline' }
      : { verses: [], loading: translation.source === 'remote', error: null, origin: null }
  );

  // Guards against a slow response for a chapter the reader already left.
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const isCurrent = () => requestId.current === currentRequest;

    if (!book) {
      setState({ verses: [], loading: false, error: 'Unknown book.', origin: null });
      return;
    }

    if (translation.source === 'offline') {
      const verses = getOfflineChapter(bookId, chapter);
      setState(
        verses
          ? { verses: toVerses(verses), loading: false, error: null, origin: 'offline' }
          : {
              verses: [],
              loading: false,
              error: `${book.name} ${chapter} is not in the bundled text.`,
              origin: null,
            }
      );
      return;
    }

    const controller = new AbortController();
    const key = cacheKey(translation.id, bookId, chapter);

    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      const cached = await readCache(key);
      if (cached && isCurrent()) {
        setState({ verses: cached, loading: false, error: null, origin: 'cache' });
        return;
      }

      try {
        const verses = await fetchChapter(
          translation.apiId as string,
          book.name,
          chapter,
          controller.signal
        );
        if (!isCurrent()) return;

        setState({ verses, loading: false, error: null, origin: 'network' });
        void writeCache(key, verses);
      } catch (error) {
        if (!isCurrent() || controller.signal.aborted) return;

        // Falling back to KJV beats showing the reader an empty screen.
        const fallback = getOfflineChapter(bookId, chapter);
        setState({
          verses: fallback ? toVerses(fallback) : [],
          loading: false,
          error: fallback
            ? `Couldn't load ${translation.abbr} — showing KJV instead.`
            : `Couldn't load ${book.name} ${chapter}. Check your connection.`,
          origin: fallback ? 'offline' : null,
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [translation.id, translation.source, translation.apiId, translation.abbr, bookId, chapter, book]);

  return state;
}
