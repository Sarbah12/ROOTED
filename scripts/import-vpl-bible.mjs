/**
 * Bundles a Creative Commons Bible into the app, the way the KJV is bundled.
 *
 *   node scripts/import-vpl-bible.mjs
 *
 * Output: assets/bible/<translation>/<book>.json
 *
 * Twi was reachable only through API.Bible, which meant a Ghanaian reader
 * needed our server to be up to read scripture in their own language, while
 * an English reader got the KJV straight from the bundle. Biblica release
 * their "Open" editions under CC BY-SA 4.0, so the text can simply ship with
 * the app — offline, instant, and costing no API quota.
 *
 * eBible.org is the source rather than API.Bible: it publishes the same
 * Biblica editions as a single verse-per-line file, so one download replaces
 * 1,189 chapter requests per translation.
 *
 * CC BY-SA obliges us to attribute and to pass the licence on. The text is
 * copied verbatim, and constants/bible-translations.ts carries the copyright
 * line the app displays alongside it.
 */

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = [
  { id: 'twi-akuapem', code: 'twi', label: 'Akuapem Twi' },
  { id: 'twi-asante', code: 'twiasante', label: 'Asante Twi' },
  { id: 'ewe', code: 'ewe', label: 'Ewe' },
  { id: 'yoruba', code: 'yor', label: 'Yoruba' },
  { id: 'igbo', code: 'ibo', label: 'Igbo' },
  // eBible carries the complete Hausa Bible; API.Bible only had the New
  // Testament, which is why the app used to flag Hausa as NT-only.
  { id: 'hausa', code: 'hausa', label: 'Hausa' },
  { id: 'swahili', code: 'swhonen', label: 'Kiswahili' },
];

/**
 * eBible uses its own three-letter codes. Most match the ids the app already
 * uses; these ten do not.
 */
const BOOK_ALIASES = {
  sol: 'sng', eze: 'ezk', joe: 'jol', nah: 'nam', mar: 'mrk',
  joh: 'jhn', jam: 'jas', '1jo': '1jn', '2jo': '2jn', '3jo': '3jn',
};

async function loadBooks() {
  const src = await readFile(path.join(root, 'constants', 'bible-books.ts'), 'utf8');
  return JSON.parse(src.match(/export const BIBLE_BOOKS: BibleBook\[\] = (\[[\s\S]*?\n\]);/)[1]);
}

/** Parses verse-per-line text ("GEN 1:1 In the beginning…") into books. */
function parseVpl(text) {
  const books = new Map();

  for (const line of text.split('\n')) {
    const match = line.match(/^(\S+)\s+(\d+):(\d+)\s+(.*)$/);
    if (!match) continue;

    const [, rawCode, chapterRaw, verseRaw, body] = match;
    const verse = body.trim();
    if (!verse) continue;

    const code = rawCode.toLowerCase();
    const id = BOOK_ALIASES[code] ?? code;

    if (!books.has(id)) books.set(id, []);
    const chapters = books.get(id);

    const chapterIndex = Number(chapterRaw) - 1;
    while (chapters.length <= chapterIndex) chapters.push([]);

    // Verse numbers are not always dense — a translation may merge two verses
    // and leave a gap. Padding keeps every verse at its own number.
    const chapter = chapters[chapterIndex];
    const verseIndex = Number(verseRaw) - 1;
    while (chapter.length < verseIndex) chapter.push('');
    chapter[verseIndex] = verse;
  }

  return books;
}

async function importOne(source, books, work) {
  const zip = path.join(work, `${source.code}.zip`);
  const url = `https://ebible.org/Scriptures/${source.code}_vpl.zip`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  await writeFile(zip, Buffer.from(await response.arrayBuffer()));

  const extracted = path.join(work, source.code);
  await run('unzip', ['-qo', zip, '-d', extracted]);

  // Bundling redistributes the text, so the licence is checked here rather
  // than trusted from a catalogue column or a comment written months ago.
  const about = await readFile(path.join(extracted, `${source.code}_about.htm`), 'utf8');
  if (!/creative commons/i.test(about)) {
    throw new Error(`${source.id}: no Creative Commons licence found in ${source.code}_about.htm`);
  }

  const text = await readFile(path.join(extracted, `${source.code}_vpl.txt`), 'utf8');
  const parsed = parseVpl(text);

  const outDir = path.join(root, 'assets', 'bible', source.id);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const problems = [];
  let verses = 0;
  let chapters = 0;

  for (const book of books) {
    const data = parsed.get(book.id);
    if (!data) {
      problems.push(`${book.name}: missing entirely`);
      continue;
    }
    if (data.length !== book.chapters) {
      problems.push(`${book.name}: ${data.length} chapters, expected ${book.chapters}`);
    }
    for (const [index, chapter] of data.entries()) {
      if (!chapter.length) problems.push(`${book.name} ${index + 1}: no verses`);
    }

    chapters += data.length;
    verses += data.reduce((sum, chapter) => sum + chapter.filter(Boolean).length, 0);
    await writeFile(path.join(outDir, `${book.id}.json`), JSON.stringify(data), 'utf8');
  }

  const extra = [...parsed.keys()].filter((id) => !books.some((b) => b.id === id));
  if (extra.length) problems.push(`unrecognised books: ${extra.join(', ')}`);

  console.log(
    `${source.label.padEnd(12)} ${books.length} books · ${chapters} chapters · ${verses} verses`,
  );
  if (problems.length) {
    console.log(`  ${problems.length} PROBLEM(S):`);
    problems.slice(0, 20).forEach((p) => console.log('   ', p));
    throw new Error(`${source.id} did not import cleanly`);
  }

  return { chapters, verses };
}

async function main() {
  const books = await loadBooks();
  const work = await mkdtemp(path.join(tmpdir(), 'vpl-'));

  try {
    for (const source of SOURCES) await importOne(source, books, work);
  } finally {
    await rm(work, { recursive: true, force: true });
  }

  console.log('\nNow run: node scripts/build-offline-index.mjs');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
