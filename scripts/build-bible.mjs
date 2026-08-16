/**
 * Builds the offline KJV bundle used by the Bible tab.
 *
 *   node scripts/build-bible.mjs
 *
 * Source: https://github.com/aruljohn/Bible-kjv — Public Domain, one file per
 * book.
 * Output:
 *   assets/bible/kjv/<bookId>.json   one file per book: [[ch1 verses], ...]
 *   constants/bible-books.ts         generated metadata for all 66 books
 *   constants/bible-offline.ts       generated lazy loader map
 *
 * ---------------------------------------------------------------------------
 * Why this source and not the obvious one.
 *
 * The bundle was first built from thiagobodruk/bible, which turned out to be
 * wrong in two ways that no code in the app could detect:
 *
 *   1. Six verses were simply absent — Matthew 2:16, 22:1 and 26:61, Mark
 *      4:40, 7:11 and 8:8 — and a missing verse silently renumbers every
 *      verse after it in its chapter. A chapter with a gap looks exactly like
 *      a chapter without one.
 *
 *   2. One verse in five had the translators' marginal apparatus welded onto
 *      the end of the text. Genesis 1:4 read "...divided the light from the
 *      darkness. the light from...: Heb. between the light and between the
 *      darkness" — editorial notes presented as Scripture.
 *
 * This source has neither: 31,102 verses, the canonical count, with no
 * apparatus in any of them. Verified chapter by chapter against a second
 * source by scripts/check-bible-bundle.mjs.
 *
 * If you ever change source again, run that audit afterwards.
 * ---------------------------------------------------------------------------
 */

import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

/** The canonical KJV totals, asserted after the build so a bad source fails loudly. */
const EXPECTED_CHAPTERS = 1189;
const EXPECTED_VERSES = 31102;
const outDir = path.join(root, 'assets', 'bible', 'kjv');

/** [appId, display name, testament] — the source file is the name without spaces. */
const BOOKS = [
  ['gen', 'Genesis', 'OT'],
  ['exo', 'Exodus', 'OT'],
  ['lev', 'Leviticus', 'OT'],
  ['num', 'Numbers', 'OT'],
  ['deu', 'Deuteronomy', 'OT'],
  ['jos', 'Joshua', 'OT'],
  ['jdg', 'Judges', 'OT'],
  ['rut', 'Ruth', 'OT'],
  ['1sa', '1 Samuel', 'OT'],
  ['2sa', '2 Samuel', 'OT'],
  ['1ki', '1 Kings', 'OT'],
  ['2ki', '2 Kings', 'OT'],
  ['1ch', '1 Chronicles', 'OT'],
  ['2ch', '2 Chronicles', 'OT'],
  ['ezr', 'Ezra', 'OT'],
  ['neh', 'Nehemiah', 'OT'],
  ['est', 'Esther', 'OT'],
  ['job', 'Job', 'OT'],
  ['psa', 'Psalms', 'OT'],
  ['pro', 'Proverbs', 'OT'],
  ['ecc', 'Ecclesiastes', 'OT'],
  ['sng', 'Song of Solomon', 'OT'],
  ['isa', 'Isaiah', 'OT'],
  ['jer', 'Jeremiah', 'OT'],
  ['lam', 'Lamentations', 'OT'],
  ['ezk', 'Ezekiel', 'OT'],
  ['dan', 'Daniel', 'OT'],
  ['hos', 'Hosea', 'OT'],
  ['jol', 'Joel', 'OT'],
  ['amo', 'Amos', 'OT'],
  ['oba', 'Obadiah', 'OT'],
  ['jon', 'Jonah', 'OT'],
  ['mic', 'Micah', 'OT'],
  ['nam', 'Nahum', 'OT'],
  ['hab', 'Habakkuk', 'OT'],
  ['zep', 'Zephaniah', 'OT'],
  ['hag', 'Haggai', 'OT'],
  ['zec', 'Zechariah', 'OT'],
  ['mal', 'Malachi', 'OT'],
  ['mat', 'Matthew', 'NT'],
  ['mrk', 'Mark', 'NT'],
  ['luk', 'Luke', 'NT'],
  ['jhn', 'John', 'NT'],
  ['act', 'Acts', 'NT'],
  ['rom', 'Romans', 'NT'],
  ['1co', '1 Corinthians', 'NT'],
  ['2co', '2 Corinthians', 'NT'],
  ['gal', 'Galatians', 'NT'],
  ['eph', 'Ephesians', 'NT'],
  ['phi', 'Philippians', 'NT'],
  ['col', 'Colossians', 'NT'],
  ['1th', '1 Thessalonians', 'NT'],
  ['2th', '2 Thessalonians', 'NT'],
  ['1ti', '1 Timothy', 'NT'],
  ['2ti', '2 Timothy', 'NT'],
  ['tit', 'Titus', 'NT'],
  ['phm', 'Philemon', 'NT'],
  ['heb', 'Hebrews', 'NT'],
  ['jas', 'James', 'NT'],
  ['1pe', '1 Peter', 'NT'],
  ['2pe', '2 Peter', 'NT'],
  ['1jn', '1 John', 'NT'],
  ['2jn', '2 John', 'NT'],
  ['3jn', '3 John', 'NT'],
  ['jud', 'Jude', 'NT'],
  ['rev', 'Revelation', 'NT'],
];

function sourceUrl(name) {
  return `${SOURCE_BASE}/${name.replace(/\s/g, '')}.json`;
}

/** KJV wraps translator-supplied words in braces; drop the markers, keep the words. */
function clean(text) {
  return String(text)
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** One book, from a local directory when given, otherwise from the source. */
async function loadBook(name, localDir) {
  const file = `${name.replace(/\s/g, '')}.json`;

  if (localDir) {
    return JSON.parse(await readFile(path.join(localDir, file), 'utf8'));
  }

  const res = await fetch(sourceUrl(name), { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Download failed for ${name}: ${res.status}`);
  return res.json();
}

async function main() {
  // Pass a directory to build from files already on disk.
  const localDir = process.argv[2];
  console.log(localDir ? `Reading ${localDir}` : `Downloading from ${SOURCE_BASE}`);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const books = [];
  let totalChapters = 0;
  let totalVerses = 0;

  for (const [id, name, testament] of BOOKS) {
    const source = await loadBook(name, localDir);

    // Chapters and verses carry their numbers as strings; sort by them rather
    // than trusting file order, so a reordered source cannot scramble a book.
    const chapters = [...source.chapters]
      .sort((a, b) => Number(a.chapter) - Number(b.chapter))
      .map((chapter) =>
        [...chapter.verses]
          .sort((a, b) => Number(a.verse) - Number(b.verse))
          .map((verse) => clean(verse.text)),
      );

    if (chapters.some((chapter) => chapter.length === 0)) {
      throw new Error(`${name} has an empty chapter`);
    }

    totalChapters += chapters.length;
    totalVerses += chapters.reduce((sum, c) => sum + c.length, 0);

    await writeFile(path.join(outDir, `${id}.json`), JSON.stringify(chapters), 'utf8');
    books.push({ id, name, chapters: chapters.length, testament });
  }

  // A source that quietly loses text should stop the build, not ship.
  if (totalChapters !== EXPECTED_CHAPTERS || totalVerses !== EXPECTED_VERSES) {
    throw new Error(
      `Expected ${EXPECTED_CHAPTERS} chapters and ${EXPECTED_VERSES} verses, ` +
        `got ${totalChapters} and ${totalVerses}`,
    );
  }

  const header = `// GENERATED by scripts/build-bible.mjs — do not edit by hand.
// Source: ${SOURCE_BASE} (King James Version, Public Domain)
// ${books.length} books · ${totalChapters} chapters · ${totalVerses} verses

export type Testament = 'OT' | 'NT';

export type BibleBook = {
  id: string;
  name: string;
  chapters: number;
  testament: Testament;
};

export const BIBLE_BOOKS: BibleBook[] = ${JSON.stringify(books, null, 2)};

export const BIBLE_BOOKS_BY_ID: Record<string, BibleBook> = Object.fromEntries(
  BIBLE_BOOKS.map((book) => [book.id, book])
);
`;

  await writeFile(path.join(root, 'constants', 'bible-books.ts'), header, 'utf8');

  // Lazy require map. Metro bundles every entry, but a book's JSON is only
  // parsed the first time its loader runs — so opening one book doesn't pay
  // the cost of all 66.
  const loaderLines = books
    .map((book) => `  '${book.id}': () => require('../assets/bible/kjv/${book.id}.json'),`)
    .join('\n');

  const offline = `// GENERATED by scripts/build-bible.mjs — do not edit by hand.
// Offline KJV text (Public Domain). Each entry is [chapter][verseIndex] => string.

type ChapterData = string[][];

const LOADERS: Record<string, () => ChapterData> = {
${loaderLines}
};

const cache = new Map<string, ChapterData>();

function loadBook(bookId: string): ChapterData | null {
  const cached = cache.get(bookId);
  if (cached) return cached;

  const loader = LOADERS[bookId];
  if (!loader) return null;

  const data = loader();
  cache.set(bookId, data);
  return data;
}

/** Verse strings for a chapter, or null when the reference does not exist. */
export function getOfflineChapter(bookId: string, chapter: number): string[] | null {
  const book = loadBook(bookId);
  if (!book) return null;
  return book[chapter - 1] ?? null;
}

export function hasOfflineBook(bookId: string): boolean {
  return bookId in LOADERS;
}
`;

  await writeFile(path.join(root, 'constants', 'bible-offline.ts'), offline, 'utf8');

  console.log(`\nWrote ${books.length} book files to assets/bible/kjv/`);
  console.log(`  ${totalChapters} chapters, ${totalVerses} verses`);
  console.log('Wrote constants/bible-books.ts');
  console.log('Wrote constants/bible-offline.ts');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
