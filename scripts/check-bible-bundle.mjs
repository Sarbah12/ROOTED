/**
 * Audits the bundled KJV for missing verses.
 *
 *   NLT_API_KEY=... node scripts/check-bible-bundle.mjs [bookId ...]
 *
 * Why this exists: the bundle shipped with Matthew 26 one verse short, which
 * silently renumbered every verse after it in that chapter. Nothing in the app
 * could notice — a chapter with a gap looks exactly like a chapter without one
 * — so the only way to catch it is to compare against another source.
 *
 * Tyndale's API serves the KJV and puts the verse range in its header
 * ("Mark 1:1-45, KJV"), which is all that is needed to compare counts without
 * downloading a second Bible. It is paced to stay well inside the daily limit.
 *
 * A mismatch does not say *which* verse is missing, only where to look.
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'assets', 'bible', 'kjv');
const KEY = process.env.NLT_API_KEY;

const BOOK_NAME_OVERRIDES = { sng: 'Song of Songs' };
const PAUSE_MS = 120;

async function chapterVerseCount(bookName, chapter) {
  const ref = encodeURIComponent(`${bookName}.${chapter}`);
  const url = `https://api.nlt.to/api/passages?ref=${ref}&version=KJV&key=${KEY}`;

  const response = await fetch(url);
  if (!response.ok) return { error: `HTTP ${response.status}` };

  const html = await response.text();
  const header = html.match(/bk_ch_vs_header">([^<]*)/)?.[1];
  if (!header) return { error: 'no header' };

  // "Mark 1:1-45, KJV" — and "Jude 1:1-25, KJV" for single-chapter books.
  const range = header.match(/(\d+):(\d+)-(\d+)/);
  if (range) return { count: Number(range[3]) };

  const single = header.match(/(\d+):(\d+),/);
  if (single) return { count: Number(single[2]) };

  return { error: `unparsed header: ${header}` };
}

async function main() {
  if (!KEY) {
    console.error('NLT_API_KEY is not set.');
    process.exit(1);
  }

  const booksSrc = await readFile(path.join(root, 'constants', 'bible-books.ts'), 'utf8');
  const books = JSON.parse(
    booksSrc.match(/export const BIBLE_BOOKS: BibleBook\[\] = (\[[\s\S]*?\n\]);/)[1],
  );

  const only = process.argv.slice(2);
  const wanted = only.length ? books.filter((b) => only.includes(b.id)) : books;

  const files = new Set(await readdir(bundleDir));
  const mismatches = [];
  const errors = [];
  let checked = 0;

  for (const book of wanted) {
    if (!files.has(`${book.id}.json`)) {
      errors.push(`${book.id}: not in the bundle`);
      continue;
    }

    const chapters = JSON.parse(await readFile(path.join(bundleDir, `${book.id}.json`), 'utf8'));
    const name = BOOK_NAME_OVERRIDES[book.id] ?? book.name;

    for (let chapter = 1; chapter <= chapters.length; chapter += 1) {
      const { count, error } = await chapterVerseCount(name, chapter);
      checked += 1;

      if (error) {
        errors.push(`${book.name} ${chapter}: ${error}`);
      } else if (count !== chapters[chapter - 1].length) {
        mismatches.push(
          `${book.name} ${chapter}: bundle has ${chapters[chapter - 1].length}, KJV has ${count}` +
            ` (missing ${count - chapters[chapter - 1].length})`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    }

    process.stdout.write(`${book.id} `);
  }

  console.log(`\n\nchecked ${checked} chapters`);

  if (mismatches.length) {
    console.log(`\n${mismatches.length} CHAPTER(S) WITH A DIFFERENT VERSE COUNT:`);
    mismatches.forEach((m) => console.log('  ', m));
  } else {
    console.log('\nEvery chapter checked matches the KJV verse count.');
  }

  if (errors.length) {
    console.log(`\n${errors.length} could not be checked:`);
    errors.slice(0, 20).forEach((e) => console.log('  ', e));
  }

  process.exit(mismatches.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
