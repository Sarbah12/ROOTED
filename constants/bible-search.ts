import { BIBLE_BOOKS } from '@/constants/bible-books';
import { getOfflineChapter } from '@/constants/bible-offline';

/**
 * Full-text search across the bundled KJV.
 *
 * All 31,102 verses are on device, so this needs no network. Scanning them does
 * mean parsing every book, which is why `searchBible` yields in batches rather
 * than doing it in one pass — a synchronous scan would freeze the interface for
 * a second or so on a mid-range phone.
 */

export type SearchResult = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export type SearchProgress = {
  results: SearchResult[];
  booksScanned: number;
  totalBooks: number;
  done: boolean;
};

const DEFAULT_LIMIT = 200;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Two modes:
 *   faith works     every term must appear, in any order, so this finds
 *                   "faith without works"
 *   "born again"    quoted, so the words must be adjacent — otherwise the
 *                   loose match pulls in verses that merely contain both
 *                   words somewhere, like Genesis 29:34
 */
export function parseQuery(query: string): { terms: string[]; phrase: string | null } {
  const quoted = query.trim().match(/^["“](.+)["”]$/);
  if (quoted) {
    const phrase = normalize(quoted[1]);
    return { terms: phrase.split(' ').filter(Boolean), phrase };
  }
  return {
    terms: normalize(query).split(' ').filter((term) => term.length > 1),
    phrase: null,
  };
}

function matches(haystack: string, terms: string[], phrase: string | null) {
  if (phrase) return haystack.includes(phrase);
  return terms.every((term) => haystack.includes(term));
}

/**
 * Scans book by book, reporting progress so the caller can show something
 * moving and let the user cancel.
 */
export async function searchBible(
  query: string,
  options: {
    limit?: number;
    testament?: 'OT' | 'NT' | 'all';
    bookId?: string;
    onProgress?: (progress: SearchProgress) => void;
    shouldCancel?: () => boolean;
  } = {},
): Promise<SearchResult[]> {
  const { limit = DEFAULT_LIMIT, testament = 'all', bookId, onProgress, shouldCancel } = options;

  const { terms, phrase } = parseQuery(query);
  if (terms.length === 0) return [];

  const books = BIBLE_BOOKS.filter((book) => {
    if (bookId) return book.id === bookId;
    if (testament !== 'all') return book.testament === testament;
    return true;
  });

  const results: SearchResult[] = [];

  for (let index = 0; index < books.length; index += 1) {
    if (shouldCancel?.()) break;

    const book = books[index];

    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      const verses = getOfflineChapter(book.id, chapter);
      if (!verses) continue;

      for (let i = 0; i < verses.length; i += 1) {
        if (matches(normalize(verses[i]), terms, phrase)) {
          results.push({
            bookId: book.id,
            bookName: book.name,
            chapter,
            verse: i + 1,
            text: verses[i],
          });

          if (results.length >= limit) {
            onProgress?.({
              results: [...results],
              booksScanned: index + 1,
              totalBooks: books.length,
              done: true,
            });
            return results;
          }
        }
      }
    }

    onProgress?.({
      results: [...results],
      booksScanned: index + 1,
      totalBooks: books.length,
      done: index === books.length - 1,
    });

    // Hand the thread back so the progress indicator can actually paint.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

/** Wraps matched terms in ** so the UI can bold them. */
export function markTerms(text: string, query: string) {
  const { terms } = parseQuery(query);
  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  return text.replace(pattern, '**$1**');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
