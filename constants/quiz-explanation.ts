import { BIBLE_BOOKS } from '@/constants/bible-books';
import { getOfflineChapter } from '@/constants/bible-offline';

/**
 * The Scripture behind a quiz answer.
 *
 * Getting a question right or wrong teaches nothing on its own; the verse it
 * came from does. Rather than authoring 490 explanations — which would be my
 * paraphrase, and would need checking one by one — the explanation *is* the
 * passage, read from the bundled text at the reference the question already
 * carries and which `npm run check` already proves resolves.
 *
 * Offline, instant, and impossible to get wrong: it is the verse or it is
 * nothing.
 */

const BY_NAME = new Map(BIBLE_BOOKS.map((book) => [book.name.toLowerCase(), book]));
BY_NAME.set('psalm', BY_NAME.get('psalms')!);
BY_NAME.set('song of songs', BY_NAME.get('song of solomon')!);

/** How many verses to show when a reference names a range or a whole chapter. */
const MAX_VERSES = 4;

export type QuizExplanation = {
  reference: string;
  verses: { verse: number; text: string }[];
  /** True when the passage is longer than what is shown. */
  truncated: boolean;
};

export function explainAnswer(reference: string): QuizExplanation | null {
  // "1 Samuel 17:49", "Matthew 6:9-13", "Psalm 51", "Exodus 7-12"
  const withVerse = reference.match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/);
  const chapterOnly = reference.match(/^(.+?)\s+(\d+)(?:\s*-\s*\d+)?$/);
  const match = withVerse ?? chapterOnly;
  if (!match) return null;

  const book = BY_NAME.get(match[1].trim().toLowerCase());
  if (!book) return null;

  const chapter = Number(match[2]);
  const text = getOfflineChapter(book.id, chapter);
  if (!text) return null;

  const first = withVerse ? Number(match[3]) : 1;
  const last = withVerse && match[4] ? Number(match[4]) : first;

  const verses: { verse: number; text: string }[] = [];
  for (let n = first; n <= last && verses.length < MAX_VERSES; n += 1) {
    const line = text[n - 1];
    if (line) verses.push({ verse: n, text: line });
  }

  if (verses.length === 0) return null;

  return {
    // Name what is actually shown, so a range does not promise more than it gives.
    reference:
      verses.length === 1
        ? `${book.name} ${chapter}:${verses[0].verse}`
        : `${book.name} ${chapter}:${verses[0].verse}-${verses[verses.length - 1].verse}`,
    verses,
    truncated: last > verses[verses.length - 1].verse,
  };
}
