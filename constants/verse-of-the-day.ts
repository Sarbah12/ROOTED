import { BIBLE_BOOKS_BY_ID } from '@/constants/bible-books';
import { getOfflineChapter } from '@/constants/bible-offline';
import { VERSE_POOL } from '@/constants/verse-pool';

/**
 * Verse of the day.
 *
 * A different verse every day, for years, without repeating — and without
 * storing any state. The day number is mapped through a bijection over the
 * pool, so each cycle visits every verse exactly once before any repeats, and
 * each cycle walks them in a different order.
 *
 * With ~2,500 verses that is about seven years before one comes round again,
 * and the order differs when it does.
 */

/** Days since the Unix epoch, so the verse turns over at local midnight. */
function dayIndex(date: Date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

/**
 * Largest odd number below n that shares no factor with it, used as the stride.
 * Any stride coprime with n visits every position exactly once, which is what
 * makes the walk a permutation rather than a sampling.
 */
function coprimeStride(n: number) {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  // Roughly the golden ratio gives a well-spread stride; walk down to the first
  // coprime value from there.
  let stride = Math.floor(n * 0.618) | 1;
  while (stride > 1 && gcd(stride, n) !== 1) stride -= 2;
  return stride > 1 ? stride : 1;
}

const POOL_SIZE = VERSE_POOL.length;
const STRIDE = coprimeStride(POOL_SIZE);

/**
 * Position within the pool for a given day.
 *
 * `cycle` shifts the starting point each time round, so the second pass through
 * the pool is not the same sequence as the first.
 */
function poolIndexFor(day: number) {
  const cycle = Math.floor(day / POOL_SIZE);
  const position = ((day % POOL_SIZE) + POOL_SIZE) % POOL_SIZE;
  return (position * STRIDE + cycle * 7919) % POOL_SIZE;
}

export type DailyVerse = {
  text: string;
  reference: string;
  /** The book, used as a light-touch label in the UI. */
  theme: string;
};

export function getVerseOfTheDay(date = new Date()): DailyVerse {
  const day = dayIndex(date);

  // Walk forward if an entry somehow cannot be read, rather than showing
  // nothing. The bundle covers all 66 books, so this should not trigger.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const entry = VERSE_POOL[poolIndexFor(day + attempt)];
    if (!entry) continue;

    const [bookId, chapter, verse] = entry;
    const book = BIBLE_BOOKS_BY_ID[bookId];
    const verses = getOfflineChapter(bookId, chapter);
    const text = verses?.[verse - 1];

    if (book && text) {
      return {
        // Psalm titles are bracketed in the source and read oddly alone.
        text: `“${text.replace(/^\[[^\]]*\]\s*/, '')}”`,
        reference: `${book.name} ${chapter}:${verse}`,
        theme: book.name,
      };
    }
  }

  return { text: '', reference: '', theme: '' };
}

/** Exposed so the About screen can state how long the rotation runs. */
export const VERSE_ROTATION = {
  poolSize: POOL_SIZE,
  yearsBeforeRepeat: POOL_SIZE / 365,
};
