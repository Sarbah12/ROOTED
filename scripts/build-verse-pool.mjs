/**
 * Builds the verse-of-the-day pool from the bundled KJV.
 *
 *   node scripts/build-verse-pool.mjs
 *
 * Output: constants/verse-pool.ts — references only. The text is read from the
 * bundle at runtime, so this adds a few tens of kilobytes rather than a copy of
 * the Bible.
 *
 * Not every verse suits standing alone on a home screen. Genealogies, tribal
 * allocations, census numbers and ritual measurements are all Scripture, but
 * "and Arphaxad begat Salah" is not a verse of the day. The filters below aim
 * for verses that read as a complete thought out of context.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'assets', 'bible', 'kjv');

const MIN_LENGTH = 70;
const MAX_LENGTH = 230;

/**
 * A verse earns its place by carrying a thought worth sitting with, so
 * selection is driven by what a verse *contains*, not only by what it avoids.
 * Excluding genealogies alone still leaves land allocations, temple taxes and
 * narrative connective tissue.
 */
const DEVOTIONAL_TERMS = [
  // God and his character
  'lord', 'god', 'jesus', 'christ', 'father', 'spirit', 'holy', 'almighty',
  'saviour', 'redeemer', 'shepherd',
  // Response and relationship
  'faith', 'believe', 'trust', 'hope', 'love', 'pray', 'prayer', 'worship',
  'praise', 'rejoice', 'thanks', 'repent', 'obey', 'follow', 'seek',
  // Gift and promise
  'grace', 'mercy', 'peace', 'joy', 'salvation', 'saved', 'forgive', 'bless',
  'blessed', 'promise', 'covenant', 'eternal', 'everlasting', 'inherit',
  'redeem', 'deliver', 'comfort', 'refuge', 'strength', 'strong',
  // Inner life
  'heart', 'soul', 'spirit', 'mind', 'righteous', 'holy', 'pure', 'humble',
  'wisdom', 'understanding', 'knowledge', 'truth', 'light', 'life',
  // Kingdom
  'kingdom', 'glory', 'heaven', 'word', 'commandment', 'law', 'faithful',
];

/** Narrative scaffolding and record-keeping — Scripture, but not a daily verse. */
const REJECT_PATTERNS = [
  /\bbegat\b/i,
  /\bthe son of\b.*\bthe son of\b/i,
  /\bwere numbered\b/i,
  /\bby their generations\b/i,
  /\bafter their famil/i,
  /\bcubits\b/i,
  /\bshekels?\b/i,
  /\bhomers?\b|\bephah\b|\bomer\b/i,
  /\bthe sons of \w+;/i,
  /\bthe coast(s)? (of|reacheth)\b/i,
  /\bpossession of\b.*\bpossession of\b/i,
  /\bborder went (up|out|along)\b/i,
  /\bit came to pass\b/i,
  /\bspake unto \w+, saying\s*$/i,
  /\banswered and said unto\b/i,
  /\breigned\b.*\byears\b/i,
  /\bslew\b/i,
  /\bsmote\b/i,
  /\bconcubine/i,
  /\bpitched\b|\bjourneyed from\b|\bencamped\b/i,
  /\bfame spread\b|\bwent out into all\b/i,
  /^\s*(And|Then|Now) (he|they|the \w+) (went|came|departed|returned|took|sent)\b/i,
  // Reported-speech openers read as fragments without their surrounding verse.
  /^\s*Saying\b/i,
  /^\s*(And|But) (he|they|Jesus) (said|answered|spake)\b/i,
  // Allocation and dedication rules — 'inheritance' and 'devote' are otherwise
  // devotional words, so these need naming explicitly.
  /\bdivide (it |the land )?by lot\b/i,
  /\bfor an inheritance unto the tribes\b|\bunto the tribes of Israel\b/i,
  /\bdevoted thing\b/i,
  // Epistle salutations and sign-offs carry the vocabulary but say nothing.
  /^\s*(To|Unto) \w+,? (my|our|a servant|an apostle)\b/i,
  /^\s*(Grace|Grace, mercy,)[^.]*from God (our|the) Father[^.]*\.\s*$/i,
  /\bsalute\b/i,
  // Judgment narration rather than address.
  /\bgave them up to\b/i,

  // Rebuke and judgment. All Scripture, none of it what someone wants waiting
  // on the home screen with their coffee.
  /\bwoe\b/i,
  /\bhypocrit/i,
  /\bvengeance\b|\bavenge\b|\brevenge/i,
  /\bvanity\b|\bvexation of spirit\b/i,
  /\bcursed?\b/i,
  /\bharlot|\bwhoredom|\badulter|\bfornicat/i,
  /\bdesolat|\bpestilence\b|\bfamine\b/i,
  /\bfierce anger\b|\bmy fury\b|\bmine anger\b|\bwrath is kindled\b/i,
  /\bput to death\b|\bstone him\b|\bdevour\b|\bcarcase|\bdung\b/i,
  /\bgeneration of vipers\b|\bscribes and Pharisees\b/i,

  // Prophetic oracles addressed to a nation in a moment, not to the reader.
  /^\s*Son of man\b/i,
  /\bprophesy against\b/i,
  /\bThus saith the Lord GOD\b/i,

  // Rebukes phrased as questions.
  /\bwhy (tempt|persecutest|do ye|call ye|reason ye|halt ye)\b/i,
  /^\s*How long (will|shall) ye\b/i,

  // Imprecatory prayer. Honest praying, but not a line to hand someone as the
  // thought for their day.
  /\bthem (that|which) persecute\b|\bpersecute me\b/i,
  /\blet them be (confounded|ashamed|desolate|put to shame)\b/i,
  /\b(destroy|scatter|confound|smite|slay|break) (them|thou them|mine enemies|the wicked)\b/i,
  /\bagainst them that\b/i,

  // Arguments internal to a first-century dispute, and quotation scaffolding.
  /\bcircumcision\b|\buncircumcis/i,
  /\bAnathema\b/i,
  /\bas it is written in the book\b|\bspoken by (the prophet|Esaias)\b/i,

  // Narration of what people did or failed to believe.
  /\bbelieved (them|him|it) not\b|\bbelieved not\b/i,
  /\bheld their peace\b/i,
  /\bto scorn\b|\bdespised thee\b|\blaughed\b/i,

  // Dialogue attribution — a fragment of a scene rather than a thought.
  /^\s*(And|Then|But|Now)?\s*\w+('s)? servants said\b/i,
  /^\s*(And|Then|But|Now)?\s*(he|she|they|Jesus|Moses|Pharaoh|Peter|Paul) (said|answered|spake|asked)\b/i,
];

/**
 * Where the pool draws from.
 *
 * Selection by book does what keyword counting cannot: it tells a promise from
 * a rebuke. The histories, the law and the judgment oracles are full of
 * devotional vocabulary while being census records, ritual measurements and
 * pronouncements against cities — so they are simply not drawn from.
 */
const CORE_BOOKS = new Set([
  // Wisdom and prophecy that speaks to the reader.
  'psa', 'pro', 'isa',
  // The Gospels.
  'mat', 'mrk', 'luk', 'jhn',
  // The letters, which are almost entirely exhortation.
  'rom', '1co', '2co', 'gal', 'eph', 'phi', 'col', '1th', '2th',
  '1ti', '2ti', 'tit', 'heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud',
]);

/** Worth drawing from, but mixed enough to need a higher bar. */
const OCCASIONAL_BOOKS = new Set([
  'deu', 'jer', 'dan', 'jol', 'mic', 'hab', 'zep', 'zec', 'mal', 'act', 'rev',
]);

function looksLikeCompleteThought(text) {
  if (!/[.!?]"?$/.test(text.trim())) return false;

  const commas = (text.match(/,/g) || []).length;
  if (commas >= 5) return false;

  const digits = (text.match(/\d/g) || []).length;
  if (digits > 2) return false;

  const words = text.split(/\s+/);
  if (words.length < 12) return false;

  // A run of capitalised words usually means a roll of names or places.
  let run = 0;
  for (const word of words) {
    const bare = word.replace(/[^A-Za-z]/g, '');
    const isName =
      bare && bare[0] === bare[0].toUpperCase() &&
      !['LORD', 'God', 'I', 'And', 'But', 'For', 'The', 'He', 'Jesus', 'Christ',
        'Father', 'Spirit', 'Holy'].includes(bare);
    if (isName) {
      run += 1;
      if (run >= 3) return false;
    } else {
      run = 0;
    }
  }

  return true;
}

/** How many distinct devotional terms the verse carries. */
function devotionalWeight(text) {
  const lower = text.toLowerCase();
  const seen = new Set();
  for (const term of DEVOTIONAL_TERMS) {
    if (new RegExp(`\\b${term}`).test(lower)) seen.add(term);
  }
  return seen.size;
}

function isSuitable(text, bookId) {
  const isCore = CORE_BOOKS.has(bookId);
  if (!isCore && !OCCASIONAL_BOOKS.has(bookId)) return false;

  const trimmed = text.trim();
  if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) return false;
  if (REJECT_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;
  if (!looksLikeCompleteThought(trimmed)) return false;

  return devotionalWeight(trimmed) >= (isCore ? 2 : 3);
}

async function main() {
  const booksSrc = await readFile(path.join(root, 'constants', 'bible-books.ts'), 'utf8');
  const books = JSON.parse(
    booksSrc.match(/export const BIBLE_BOOKS: BibleBook\[\] = (\[[\s\S]*?\n\]);/)[1]
  );

  const files = new Set(await readdir(bundleDir));
  const pool = [];
  let scanned = 0;

  for (const book of books) {
    const fileName = `${book.id}.json`;
    if (!files.has(fileName)) continue;

    const chapters = JSON.parse(await readFile(path.join(bundleDir, fileName), 'utf8'));

    chapters.forEach((verses, chapterIndex) => {
      verses.forEach((text, verseIndex) => {
        scanned += 1;
        if (isSuitable(text, book.id)) {
          pool.push([book.id, chapterIndex + 1, verseIndex + 1]);
        }
      });
    });
  }

  const header = `// GENERATED by scripts/build-verse-pool.mjs — do not edit by hand.
//
// References only; the text is read from assets/bible/kjv at runtime.
// ${pool.length} verses, filtered from ${scanned} for reading well on their own.
// At one per day that is roughly ${(pool.length / 365).toFixed(1)} years before any repeat.

/** [bookId, chapter, verse] */
export type PoolEntry = readonly [string, number, number];

export const VERSE_POOL: PoolEntry[] = ${JSON.stringify(pool)
    .replace(/\],\[/g, '],\n  [')
    .replace(/^\[/, '[\n  ')
    .replace(/\]$/, ',\n]')};
`;

  await writeFile(path.join(root, 'constants', 'verse-pool.ts'), header, 'utf8');

  console.log(`Scanned ${scanned} verses`);
  console.log(`Pool: ${pool.length} (${((pool.length / scanned) * 100).toFixed(1)}%)`);
  console.log(`≈ ${(pool.length / 365).toFixed(1)} years before repeating`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
