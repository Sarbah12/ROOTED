import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

import { useFirebaseAuth } from '@/context/firebase-auth';

import { BIBLE_BOOKS_BY_ID } from '@/constants/bible-books';
import { DEFAULT_TRANSLATION, getOfflineChapter } from '@/constants/bible-offline';
import { BACKEND_API_BASE_URL } from '@/constants/firebase';
import { getTranslation, isUnavailableFor } from '@/constants/bible-translations';

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
  /** Publishers require this shown alongside licensed text. */
  copyright: string | null;
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

/**
 * Licensed text is proxied by our backend so the API.Bible key is never in the
 * app bundle. Returns the copyright line the publisher requires.
 */
async function fetchLicensedChapter(
  bibleId: string,
  bookId: string,
  chapter: number,
  idToken: string | null,
  signal: AbortSignal
): Promise<{ verses: ChapterVerse[]; copyright: string }> {
  const response = await fetch(
    `${BACKEND_API_BASE_URL}/v1/bible/${encodeURIComponent(bibleId)}/${bookId}/${chapter}`,
    // Public-domain texts are served without a token; the server decides
    // which ids are open, so sending one when we have it costs nothing.
    { signal, headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || 'Licensed translation unavailable');
  }

  return { verses: payload.verses ?? [], copyright: payload.copyright ?? '' };
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
  const { idToken } = useFirebaseAuth();
  const translation = getTranslation(translationId);
  const book = BIBLE_BOOKS_BY_ID[bookId];

  const willFetch =
    translation.source === 'remote' && !(book && isUnavailableFor(translation, book.testament));

  // A bundled translation reads its own text. Every fallback elsewhere in this
  // hook stays on the KJV, which is the one translation always present.
  const offlineId = translation.source === 'offline' ? translation.id : DEFAULT_TRANSLATION;

  const offlineVerses =
    translation.source === 'offline' || !willFetch
      ? getOfflineChapter(bookId, chapter, offlineId)
      : null;

  const [state, setState] = useState<ChapterState>(() =>
    offlineVerses
      ? {
          verses: toVerses(offlineVerses),
          loading: false,
          error: null,
          origin: 'offline',
          // CC BY-SA obliges us to show this next to the text, not bury it.
          copyright: translation.copyright ?? null,
        }
      : { verses: [], loading: willFetch, error: null, origin: null, copyright: null }
  );

  // Guards against a slow response for a chapter the reader already left.
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const isCurrent = () => requestId.current === currentRequest;

    if (!book) {
      setState({ verses: [], loading: false, error: 'Unknown book.', origin: null, copyright: null });
      return;
    }

    // Several public-domain translations carry only the New Testament. Say so
    // and fall back, rather than letting the request 404 with no explanation.
    if (isUnavailableFor(translation, book.testament)) {
      const fallback = getOfflineChapter(bookId, chapter);
      setState({
        verses: fallback ? toVerses(fallback) : [],
        loading: false,
        error: `${translation.abbr} covers the New Testament only — showing KJV.`,
        origin: fallback ? 'offline' : null,
        copyright: null,
      });
      return;
    }

    if (translation.source === 'offline') {
      const verses = getOfflineChapter(bookId, chapter, offlineId);
      setState(
        verses
          ? {
              verses: toVerses(verses),
              loading: false,
              error: null,
              origin: 'offline',
              copyright: translation.copyright ?? null,
            }
          : {
              verses: [],
              loading: false,
              error: `${book.name} ${chapter} is not in the bundled text.`,
              origin: null,
              copyright: null,
            }
      );
      return;
    }

    const controller = new AbortController();
    const key = cacheKey(translation.id, bookId, chapter);

    if (translation.provider === 'licensed' || translation.provider === 'proxied') {
      // Only the licensed ones need an account; proxied are public domain.
      if (translation.provider === 'licensed' && !idToken) {
        setState({
          verses: [],
          loading: false,
          error: 'Sign in to read licensed translations.',
          origin: null,
          copyright: null,
        });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      (async () => {
        const cached = await readCache(key);
        if (cached && isCurrent()) {
          setState({ verses: cached, loading: false, error: null, origin: 'cache', copyright: null });
          return;
        }

        try {
          let result;

          try {
            result = await fetchLicensedChapter(
              translation.bibleId as string,
              bookId,
              chapter,
              idToken,
              controller.signal
            );
          } catch (proxyError) {
            // A public-domain text that also exists on bible-api.com can still
            // be read when our own backend is unreachable. Preferring the proxy
            // is about reliability and caching, not access — so losing it
            // should degrade to the old path rather than to nothing.
            if (translation.provider !== 'proxied' || !translation.apiId) throw proxyError;

            const verses = await fetchChapter(
              translation.apiId,
              book.name,
              chapter,
              controller.signal
            );
            result = { verses, copyright: translation.copyright ?? '' };
          }

          if (!isCurrent()) return;

          setState({
            verses: result.verses,
            loading: false,
            error: null,
            origin: 'network',
            copyright: result.copyright || translation.copyright || null,
          });
          void writeCache(key, result.verses);
        } catch (error) {
          if (!isCurrent() || controller.signal.aborted) return;

          const fallback = getOfflineChapter(bookId, chapter);
          setState({
            verses: fallback ? toVerses(fallback) : [],
            loading: false,
            error: fallback
              ? `Couldn't load ${translation.abbr} — showing KJV instead.`
              : `Couldn't load ${translation.abbr}.`,
            origin: fallback ? 'offline' : null,
            copyright: null,
          });
        }
      })();

      return () => controller.abort();
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      const cached = await readCache(key);
      if (cached && isCurrent()) {
        setState({ verses: cached, loading: false, error: null, origin: 'cache', copyright: null });
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

        setState({ verses, loading: false, error: null, origin: 'network', copyright: null });
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
          copyright: null,
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    translation.id,
    translation.source,
    translation.apiId,
    translation.abbr,
    translation.coverage,
    translation.provider,
    translation.bibleId,
    translation.copyright,
    idToken,
    bookId,
    chapter,
    book,
  ]);

  return state;
}
