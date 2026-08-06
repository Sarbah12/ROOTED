import { BIBLE_BOOKS_BY_ID } from '@/constants/bible-books';
import { getOfflineChapter } from '@/constants/bible-offline';

/**
 * Verse of the day.
 *
 * The reference rotates by calendar day and the text is read from the bundled
 * KJV, so it is genuinely a different verse each day rather than a fixed string
 * labelled "today".
 */

type VerseRef = {
  bookId: string;
  chapter: number;
  verse: number;
  theme: string;
};

const ROTATION: VerseRef[] = [
  { bookId: 'jhn', chapter: 3, verse: 16, theme: 'Love' },
  { bookId: 'psa', chapter: 23, verse: 1, theme: 'Comfort' },
  { bookId: 'pro', chapter: 3, verse: 5, theme: 'Trust' },
  { bookId: 'isa', chapter: 40, verse: 31, theme: 'Strength' },
  { bookId: 'rom', chapter: 8, verse: 28, theme: 'Purpose' },
  { bookId: 'phi', chapter: 4, verse: 13, theme: 'Strength' },
  { bookId: 'jos', chapter: 1, verse: 9, theme: 'Courage' },
  { bookId: 'psa', chapter: 46, verse: 1, theme: 'Refuge' },
  { bookId: 'mat', chapter: 6, verse: 33, theme: 'Priorities' },
  { bookId: 'jer', chapter: 29, verse: 11, theme: 'Hope' },
  { bookId: 'psa', chapter: 119, verse: 105, theme: 'Guidance' },
  { bookId: 'jas', chapter: 1, verse: 5, theme: 'Wisdom' },
  { bookId: 'eph', chapter: 2, verse: 8, theme: 'Grace' },
  { bookId: '1co', chapter: 13, verse: 13, theme: 'Love' },
  { bookId: 'gal', chapter: 5, verse: 22, theme: 'Growth' },
  { bookId: 'heb', chapter: 11, verse: 1, theme: 'Faith' },
  { bookId: 'psa', chapter: 27, verse: 1, theme: 'Confidence' },
  { bookId: 'mat', chapter: 11, verse: 28, theme: 'Rest' },
  { bookId: '2co', chapter: 5, verse: 17, theme: 'New life' },
  { bookId: 'pro', chapter: 9, verse: 10, theme: 'Wisdom' },
  { bookId: 'jhn', chapter: 14, verse: 6, theme: 'The Way' },
  { bookId: 'psa', chapter: 1, verse: 3, theme: 'Rooted' },
  { bookId: 'isa', chapter: 41, verse: 10, theme: 'Assurance' },
  { bookId: 'rom', chapter: 12, verse: 2, theme: 'Renewal' },
  { bookId: 'mic', chapter: 6, verse: 8, theme: 'Justice' },
  { bookId: 'psa', chapter: 139, verse: 14, theme: 'Identity' },
  { bookId: 'jhn', chapter: 15, verse: 5, theme: 'Abiding' },
  { bookId: '1pe', chapter: 5, verse: 7, theme: 'Care' },
  { bookId: 'col', chapter: 3, verse: 23, theme: 'Work' },
  { bookId: 'lam', chapter: 3, verse: 22, theme: 'Mercy' },
  { bookId: 'act', chapter: 1, verse: 8, theme: 'Power' },
];

/** Days since epoch, so the verse changes at local midnight. */
function dayIndex(date: Date) {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local / 86_400_000);
}

export type DailyVerse = {
  text: string;
  reference: string;
  theme: string;
};

export function getVerseOfTheDay(date = new Date()): DailyVerse {
  const pick = ROTATION[dayIndex(date) % ROTATION.length];
  const book = BIBLE_BOOKS_BY_ID[pick.bookId];
  const verses = getOfflineChapter(pick.bookId, pick.chapter);
  const text = verses?.[pick.verse - 1];

  const reference = `${book?.name ?? pick.bookId} ${pick.chapter}:${pick.verse}`;

  // The bundle covers all 66 books, so this should not happen — but never show
  // a placeholder verse if it somehow does.
  if (!text) {
    return { text: '', reference, theme: pick.theme };
  }

  return { text: `“${text}”`, reference, theme: pick.theme };
}
