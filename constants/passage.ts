import { BIBLE_BOOKS } from '@/constants/bible-books';

/**
 * Turns a plan's reference into the chapters it actually names.
 *
 * Plan days are not all "John 3". The generated templates collapse consecutive
 * chapters — "Matthew 1-3" — and a day that crosses a book boundary reads
 * "Malachi 4 · Matthew 1". The day screen used to parse only the single-chapter
 * form, so most days of most plans resolved to nothing and showed no scripture
 * at all.
 */

export type PassageChapter = {
  bookId: string;
  bookName: string;
  chapter: number;
};

const BY_NAME = new Map(BIBLE_BOOKS.map((book) => [book.name.toLowerCase(), book]));
// References are written the way people say them.
BY_NAME.set('psalm', BY_NAME.get('psalms')!);
BY_NAME.set('song of songs', BY_NAME.get('song of solomon')!);

/** Every chapter a reference names, in order. Empty when it cannot be read. */
export function parsePassage(reference: string): PassageChapter[] {
  const out: PassageChapter[] = [];

  for (const part of reference.split(/\s*[·;]\s*/)) {
    const match = part.trim().match(/^(.+?)\s+(\d+)(?:\s*[-–]\s*(\d+))?$/);
    if (!match) continue;

    const book = BY_NAME.get(match[1].trim().toLowerCase());
    if (!book) continue;

    const first = Number(match[2]);
    const last = match[3] ? Number(match[3]) : first;

    for (let chapter = first; chapter <= last && chapter <= book.chapters; chapter += 1) {
      out.push({ bookId: book.id, bookName: book.name, chapter });
    }
  }

  return out;
}
