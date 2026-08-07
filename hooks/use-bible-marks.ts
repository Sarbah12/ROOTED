import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Highlights, bookmarks, and where the reader left off.
 *
 * Previously these lived in component state as bare verse numbers, which meant
 * two things: they vanished on restart, and because nothing recorded which
 * chapter a number belonged to, highlighting John 3:16 also highlighted
 * Genesis 1:16. Marks are now keyed by book and chapter and persisted.
 *
 * Local only — there is no server endpoint for marks.
 */

const MARKS_KEY = 'rooted:bible-marks:v1';
const POSITION_KEY = 'rooted:bible-position:v1';

/** `jhn-3` — the same shape used elsewhere for chapter references. */
function chapterKey(bookId: string, chapter: number) {
  return `${bookId}-${chapter}`;
}

type MarkStore = {
  highlights: Record<string, number[]>;
  bookmarks: Record<string, number[]>;
};

export type ReadingPosition = {
  bookId: string;
  chapter: number;
  updatedAt: string;
};

const EMPTY: MarkStore = { highlights: {}, bookmarks: {} };

export function useBibleMarks(bookId: string, chapter: number) {
  const [store, setStore] = useState<MarkStore>(EMPTY);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<MarkStore>(EMPTY);

  useEffect(() => {
    let active = true;
    (async () => {
      let loaded = EMPTY;
      try {
        const raw = await AsyncStorage.getItem(MARKS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<MarkStore>;
          loaded = {
            highlights: parsed.highlights ?? {},
            bookmarks: parsed.bookmarks ?? {},
          };
        }
      } catch {
        loaded = EMPTY;
      }
      if (!active) return;
      storeRef.current = loaded;
      setStore(loaded);
      setIsLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: MarkStore) => {
    storeRef.current = next;
    setStore(next);
    AsyncStorage.setItem(MARKS_KEY, JSON.stringify(next)).catch(() => {
      // Best-effort; the in-memory value still drives the UI.
    });
  }, []);

  const toggle = useCallback(
    (kind: 'highlights' | 'bookmarks', verse: number) => {
      const key = chapterKey(bookId, chapter);
      const current = storeRef.current[kind][key] ?? [];
      const next = current.includes(verse)
        ? current.filter((item) => item !== verse)
        : [...current, verse].sort((a, b) => a - b);

      const updated: MarkStore = {
        ...storeRef.current,
        [kind]: { ...storeRef.current[kind], [key]: next },
      };

      // Drop empty arrays so the store does not grow with every chapter visited.
      if (next.length === 0) delete updated[kind][key];

      persist(updated);
    },
    [bookId, chapter, persist],
  );

  const key = chapterKey(bookId, chapter);

  const countAll = (kind: 'highlights' | 'bookmarks') =>
    Object.values(store[kind]).reduce((sum, list) => sum + list.length, 0);

  return {
    isLoaded,
    highlightedVerses: store.highlights[key] ?? [],
    bookmarkedVerses: store.bookmarks[key] ?? [],
    toggleHighlight: (verse: number) => toggle('highlights', verse),
    toggleBookmark: (verse: number) => toggle('bookmarks', verse),
    /** Totals across the whole Bible, for the header counts. */
    totalHighlights: countAll('highlights'),
    totalBookmarks: countAll('bookmarks'),
    /** Every bookmark, for a future "saved verses" screen. */
    allBookmarks: store.bookmarks,
  };
}

/** Remembers the last chapter opened, so "resume reading" means something. */
export function useReadingPosition() {
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let stored: ReadingPosition | null = null;
      try {
        const raw = await AsyncStorage.getItem(POSITION_KEY);
        stored = raw ? (JSON.parse(raw) as ReadingPosition) : null;
      } catch {
        stored = null;
      }
      if (!active) return;
      setPosition(stored);
      setIsLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const record = useCallback((bookId: string, chapter: number) => {
    const next: ReadingPosition = {
      bookId,
      chapter,
      updatedAt: new Date().toISOString(),
    };
    setPosition(next);
    AsyncStorage.setItem(POSITION_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return { position, isLoaded, record };
}
