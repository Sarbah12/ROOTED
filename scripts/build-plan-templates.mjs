/**
 * Builds the starter reading plans.
 *
 *   node scripts/build-plan-templates.mjs
 *
 * Output: constants/plan-templates.ts
 *
 * The app had three plans defined server-side as names and colours with no
 * readings attached — nothing could be joined or followed. Meanwhile the study
 * plans feature could only create your own or join someone else's by code, so
 * a new user with no friends opened the screen to an empty room.
 *
 * These are real schedules generated from the bundled text, so every day names
 * a passage that exists, and the day count is arithmetic rather than a guess.
 *
 * Two kinds of plan live here. `plan()` takes books and divides their chapters
 * evenly across a number of days — the arithmetic is the schedule. `curated()`
 * takes a hand-written list where each day is chosen for what it says about a
 * subject, which no amount of dividing can produce.
 *
 * Everything is chapter-level. `parsePassage` reads chapters, not verse
 * ranges, so a day that said "Philippians 4:4-9" would show nothing at all.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every chapter of the given books, in order, as [bookName, chapter]. */
function chaptersFor(books, ids) {
  const wanted = ids
    ? ids.map((id) => books.find((b) => b.id === id)).filter(Boolean)
    : books;

  return wanted.flatMap((book) =>
    Array.from({ length: book.chapters }, (_, i) => [book.name, i + 1]),
  );
}

/** Splits a list into `count` chunks as evenly as it divides. */
function chunk(items, count) {
  const out = [];
  const size = items.length / count;

  for (let i = 0; i < count; i += 1) {
    const start = Math.round(i * size);
    const end = Math.round((i + 1) * size);
    if (end > start) out.push(items.slice(start, end));
  }

  return out;
}

/**
 * A day's chapters as a reference someone can read.
 * Consecutive chapters of one book collapse: "Matthew 1-3", not "Matthew 1,
 * Matthew 2, Matthew 3". A day spanning two books reads "Malachi 4 · Matthew 1".
 */
function describe(dayChapters) {
  const runs = [];

  for (const [book, chapter] of dayChapters) {
    const last = runs[runs.length - 1];
    if (last && last.book === book && chapter === last.end + 1) {
      last.end = chapter;
    } else {
      runs.push({ book, start: chapter, end: chapter });
    }
  }

  return runs
    .map((run) => (run.start === run.end ? `${run.book} ${run.start}` : `${run.book} ${run.start}-${run.end}`))
    .join(' · ');
}

function plan({ id, title, description, category, days, chapters }) {
  return {
    id,
    title,
    description,
    category,
    days: chunk(chapters, days).map((day) => ({ reference: describe(day) })),
  };
}

/** A plan whose days were chosen rather than calculated. */
function curated({ id, title, description, category, days }) {
  return { id, title, description, category, days: days.map((reference) => ({ reference })) };
}

/**
 * Book-level chronological order.
 *
 * Full chronological plans interleave at verse level — Psalms dropped into the
 * middle of 2 Samuel, the gospels harmonised into one timeline. That is a
 * different and much larger piece of data, and getting it half-right would be
 * worse than not offering it. This orders the books by when their events sit
 * in the story, which is honest about what it is and still reads very
 * differently from Genesis-to-Revelation.
 */
const CHRONOLOGICAL = [
  'gen', 'job', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut',
  '1sa', '2sa', 'psa', '1ch', 'pro', 'ecc', 'sng', '1ki', '2ch',
  'oba', 'jol', 'jon', 'amo', 'hos', 'mic', 'isa', 'nam', 'zep',
  'hab', 'jer', 'lam', '2ki', 'ezk', 'dan', 'ezr', 'est', 'neh',
  'hag', 'zec', 'mal',
  'luk', 'mat', 'mrk', 'jhn', 'act', 'jas', 'gal', '1th', '2th',
  '1co', '2co', 'rom', 'eph', 'phi', 'col', 'phm', '1ti', 'tit',
  '1pe', 'heb', '2ti', '2pe', 'jud', '1jn', '2jn', '3jn', 'rev',
];

async function main() {
  const booksSrc = await readFile(path.join(root, 'constants', 'bible-books.ts'), 'utf8');
  const books = JSON.parse(
    booksSrc.match(/export const BIBLE_BOOKS: BibleBook\[\] = (\[[\s\S]*?\n\]);/)[1],
  );

  const ids = books.map((b) => b.id);
  const nt = books.filter((b) => b.testament === 'NT').map((b) => b.id);
  const ot = books.filter((b) => b.testament === 'OT').map((b) => b.id);

  // A chronological plan that quietly dropped a book would be hard to notice.
  const missing = ids.filter((id) => !CHRONOLOGICAL.includes(id));
  const unknown = CHRONOLOGICAL.filter((id) => !ids.includes(id));
  if (missing.length || unknown.length) {
    throw new Error(`chronological order is wrong — missing ${missing}, unknown ${unknown}`);
  }

  const templates = [
    // ------------------------------------------------------------- Start here
    plan({
      id: 'john-21',
      title: 'The Gospel of John in 21 days',
      description:
        'One chapter a day through the fourth gospel. A good first plan — three weeks, and you finish something.',
      category: 'Start here',
      days: 21,
      chapters: chaptersFor(books, ['jhn']),
    }),
    plan({
      id: 'mark-16',
      title: 'Mark in 16 days',
      description:
        'The shortest gospel, and the fastest moving. A chapter a day for a fortnight.',
      category: 'Start here',
      days: 16,
      chapters: chaptersFor(books, ['mrk']),
    }),
    curated({
      id: 'new-believer-30',
      title: 'First steps, 30 days',
      description:
        'A month of the passages people are usually pointed to first — who Jesus is, what grace means, and how to begin praying and living it.',
      category: 'Start here',
      days: [
        'John 1', 'John 3', 'Mark 1', 'Romans 3', 'Romans 5',
        'Romans 6', 'Romans 8', 'Romans 10', 'Romans 12', 'Ephesians 1',
        'Ephesians 2', 'Ephesians 4', 'Ephesians 6', 'Acts 1', 'Acts 2',
        '1 John 1', '1 John 4', 'Galatians 5', 'Philippians 2', 'Philippians 4',
        'Colossians 3', 'James 1', '1 Peter 1', 'Psalms 1', 'Psalms 23',
        'Matthew 5', 'Matthew 6', 'Matthew 7', 'Hebrews 11', 'Revelation 21',
      ],
    }),
    plan({
      id: 'proverbs-31',
      title: 'A proverb a day',
      description:
        'Thirty-one chapters, thirty-one days. The oldest habit in Christian reading — start on the first of the month and the numbers line up.',
      category: 'Start here',
      days: 31,
      chapters: chaptersFor(books, ['pro']),
    }),

    // -------------------------------------------------------- The whole Bible
    plan({
      id: 'bible-365',
      title: 'The whole Bible in 365 days',
      description:
        'All 66 books, Genesis to Revelation, in a year. Roughly three chapters a day.',
      category: 'The whole Bible',
      days: 365,
      chapters: chaptersFor(books),
    }),
    plan({
      id: 'bible-chronological-365',
      title: 'The Bible in a year, in order of events',
      description:
        'The same 66 books in a year, but arranged by when the events happened rather than by where they sit in the binding — Job beside Genesis, the prophets among the kings.',
      category: 'The whole Bible',
      days: 365,
      chapters: chaptersFor(books, CHRONOLOGICAL),
    }),
    plan({
      id: 'bible-180',
      title: 'The whole Bible in 180 days',
      description:
        'Genesis to Revelation in six months. Around seven chapters a day — demanding, and it moves fast enough to feel like one story.',
      category: 'The whole Bible',
      days: 180,
      chapters: chaptersFor(books),
    }),
    plan({
      id: 'ot-180',
      title: 'The Old Testament in 180 days',
      description:
        'Genesis through Malachi in six months. About five chapters a day.',
      category: 'The whole Bible',
      days: 180,
      chapters: chaptersFor(books, ot),
    }),
    plan({
      id: 'nt-90',
      title: 'The New Testament in 90 days',
      description:
        'Matthew through Revelation in three months. About three chapters a day.',
      category: 'The whole Bible',
      days: 90,
      chapters: chaptersFor(books, nt),
    }),
    plan({
      id: 'nt-30',
      title: 'The New Testament in 30 days',
      description:
        'The whole New Testament in a month. Nine chapters a day — a serious commitment, and a very different view of the shape of it.',
      category: 'The whole Bible',
      days: 30,
      chapters: chaptersFor(books, nt),
    }),

    // --------------------------------------------------------- Books & groups
    plan({
      id: 'gospels-40',
      title: 'The four gospels in 40 days',
      description:
        'Matthew, Mark, Luke and John — the same life told four ways. Around two chapters a day.',
      category: 'Books of the Bible',
      days: 40,
      chapters: chaptersFor(books, ['mat', 'mrk', 'luk', 'jhn']),
    }),
    plan({
      id: 'luke-24',
      title: 'Luke in 24 days',
      description:
        'A chapter a day through the fullest account of Jesus’ life, written for someone who wanted the story checked and ordered.',
      category: 'Books of the Bible',
      days: 24,
      chapters: chaptersFor(books, ['luk']),
    }),
    plan({
      id: 'matthew-28',
      title: 'Matthew in 28 days',
      description:
        'Four weeks, a chapter a day, through the gospel that ties everything back to what was promised.',
      category: 'Books of the Bible',
      days: 28,
      chapters: chaptersFor(books, ['mat']),
    }),
    plan({
      id: 'acts-28',
      title: 'Acts in 28 days',
      description:
        'How a frightened handful in a locked room became a church across an empire. A chapter a day.',
      category: 'Books of the Bible',
      days: 28,
      chapters: chaptersFor(books, ['act']),
    }),
    plan({
      id: 'romans-16',
      title: 'Romans in 16 days',
      description:
        'Paul’s longest and most careful argument, a chapter a day. Slow reading rewards this one.',
      category: 'Books of the Bible',
      days: 16,
      chapters: chaptersFor(books, ['rom']),
    }),
    plan({
      id: 'genesis-50',
      title: 'Genesis in 50 days',
      description:
        'Creation, the flood, and one family followed for four generations. A chapter a day.',
      category: 'Books of the Bible',
      days: 50,
      chapters: chaptersFor(books, ['gen']),
    }),
    plan({
      id: 'psalms-60',
      title: 'The Psalms in 60 days',
      description:
        'All 150, two or three a day. Israel’s prayers for every mood there is — including the ones people avoid praying.',
      category: 'Books of the Bible',
      days: 60,
      chapters: chaptersFor(books, ['psa']),
    }),
    plan({
      id: 'psalms-proverbs-60',
      title: 'Psalms & Proverbs in 60 days',
      description:
        'The songbook and the wisdom of Israel, side by side. Short readings, good for a busy season.',
      category: 'Books of the Bible',
      days: 60,
      chapters: chaptersFor(books, ['psa', 'pro']),
    }),
    plan({
      id: 'torah-60',
      title: 'The first five books in 60 days',
      description:
        'Genesis through Deuteronomy — the foundation everything after it refers back to. Around three chapters a day.',
      category: 'Books of the Bible',
      days: 60,
      chapters: chaptersFor(books, ['gen', 'exo', 'lev', 'num', 'deu']),
    }),
    plan({
      id: 'paul-letters-45',
      title: 'Paul’s letters in 45 days',
      description:
        'Romans through Philemon — thirteen letters to real churches with real problems, in six and a half weeks.',
      category: 'Books of the Bible',
      days: 45,
      chapters: chaptersFor(books, [
        'rom', '1co', '2co', 'gal', 'eph', 'phi', 'col',
        '1th', '2th', '1ti', '2ti', 'tit', 'phm',
      ]),
    }),
    plan({
      id: 'minor-prophets-36',
      title: 'The twelve prophets in 36 days',
      description:
        'Hosea to Malachi. Short books, mostly skipped, and some of the fiercest writing about justice and mercy anywhere in the Bible.',
      category: 'Books of the Bible',
      days: 36,
      chapters: chaptersFor(books, [
        'hos', 'jol', 'amo', 'oba', 'jon', 'mic',
        'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
      ]),
    }),
    plan({
      id: 'wisdom-40',
      title: 'The wisdom books in 40 days',
      description:
        'Job, Ecclesiastes and Song of Solomon — suffering, meaning, and love. The three books that argue with easy answers.',
      category: 'Books of the Bible',
      days: 40,
      chapters: chaptersFor(books, ['job', 'ecc', 'sng']),
    }),
    plan({
      id: 'revelation-22',
      title: 'Revelation in 22 days',
      description:
        'A chapter a day through the last book — written to churches under pressure, not as a puzzle to solve.',
      category: 'Books of the Bible',
      days: 22,
      chapters: chaptersFor(books, ['rev']),
    }),

    // ---------------------------------------------------------------- Seasons
    curated({
      id: 'holy-week-8',
      title: 'Holy Week',
      description:
        'Palm Sunday to the empty tomb, one day at a time, in the order it happened.',
      category: 'Seasons',
      days: [
        'Matthew 21', 'Mark 11', 'Matthew 24', 'John 13',
        'Matthew 26', 'John 17', 'John 19', 'John 20',
      ],
    }),
    curated({
      id: 'advent-25',
      title: 'Advent, 25 days to Christmas',
      description:
        'What was promised, and then what arrived. Fifteen days in the prophets and psalms, ten in the gospels.',
      category: 'Seasons',
      days: [
        'Genesis 3', 'Genesis 12', 'Isaiah 7', 'Isaiah 9', 'Isaiah 11',
        'Isaiah 40', 'Isaiah 53', 'Micah 5', 'Jeremiah 23', 'Zechariah 9',
        'Malachi 3', 'Psalms 2', 'Psalms 22', 'Psalms 72', 'Psalms 110',
        'Luke 1', 'Matthew 1', 'Luke 2', 'Matthew 2', 'John 1',
        'Galatians 4', 'Philippians 2', 'Hebrews 1', 'Titus 2', 'Revelation 21',
      ],
    }),
    curated({
      id: 'lent-40',
      title: 'Lent, 40 days',
      description:
        'Forty days through wilderness, repentance and the road to the cross — the passages the season has always been built on.',
      category: 'Seasons',
      days: [
        'Genesis 3', 'Exodus 16', 'Exodus 20', 'Numbers 14', 'Deuteronomy 8',
        'Deuteronomy 30', '1 Kings 19', '2 Chronicles 7', 'Nehemiah 9', 'Job 42',
        'Psalms 6', 'Psalms 32', 'Psalms 38', 'Psalms 51', 'Psalms 102',
        'Psalms 130', 'Psalms 143', 'Isaiah 1', 'Isaiah 53', 'Isaiah 55',
        'Isaiah 58', 'Jeremiah 31', 'Lamentations 3', 'Ezekiel 36', 'Daniel 9',
        'Hosea 6', 'Joel 2', 'Jonah 3', 'Micah 6', 'Zechariah 7',
        'Matthew 4', 'Matthew 5', 'Matthew 6', 'Luke 15', 'Luke 18',
        'Luke 22', 'Luke 23', 'John 12', 'Romans 6', 'Luke 24',
      ],
    }),
    curated({
      id: 'gratitude-14',
      title: 'Thanksgiving, 14 days',
      description:
        'Two weeks in the passages that give thanks — several of them written by people with very little to be thankful for.',
      category: 'Seasons',
      days: [
        'Psalms 100', 'Psalms 103', 'Psalms 107', 'Psalms 136', 'Psalms 145',
        'Psalms 34', '1 Chronicles 16', 'Luke 17', 'Colossians 3', 'Ephesians 5',
        '1 Thessalonians 5', 'Philippians 4', '2 Corinthians 9', 'Revelation 7',
      ],
    }),

    // ------------------------------------------------------------ Life & need
    curated({
      id: 'anxiety-14',
      title: 'Peace for anxious days',
      description:
        'Fourteen passages for a mind that will not settle. Read one, slowly, when the day starts or when it will not end.',
      category: 'For where you are',
      days: [
        'Philippians 4', 'Matthew 6', 'Psalms 23', 'Psalms 46', 'Psalms 91',
        'Isaiah 41', 'Isaiah 43', 'John 14', '1 Peter 5', 'Psalms 121',
        'Matthew 11', 'Romans 8', '2 Corinthians 12', 'Psalms 34',
      ],
    }),
    curated({
      id: 'grief-14',
      title: 'Comfort in grief',
      description:
        'For loss. These do not hurry you — several of them sit in the dark and say so plainly.',
      category: 'For where you are',
      days: [
        'Psalms 23', 'Psalms 34', 'Psalms 42', 'Lamentations 3', 'Job 19',
        'Isaiah 61', 'Matthew 5', 'John 11', 'Romans 8', '2 Corinthians 1',
        '1 Thessalonians 4', '1 Corinthians 15', 'Psalms 147', 'Revelation 21',
      ],
    }),
    curated({
      id: 'hard-times-21',
      title: 'When life is hard',
      description:
        'Three weeks on suffering that does not lift quickly — Job, the psalms that complain, and what the New Testament does with endurance.',
      category: 'For where you are',
      days: [
        'Job 1', 'Job 2', 'Job 38', 'Job 42', 'Psalms 13',
        'Psalms 22', 'Psalms 42', 'Psalms 73', 'Psalms 77', 'Habakkuk 3',
        'Lamentations 3', 'Isaiah 40', 'Romans 5', 'Romans 8', '2 Corinthians 4',
        '2 Corinthians 12', 'James 1', '1 Peter 1', '1 Peter 4', 'Hebrews 12',
        'Revelation 21',
      ],
    }),
    curated({
      id: 'prayer-21',
      title: 'Learning to pray',
      description:
        'Three weeks of prayers people actually prayed — and the two occasions Jesus was asked to teach it.',
      category: 'For where you are',
      days: [
        'Matthew 6', 'Luke 11', 'Luke 18', 'Psalms 5', 'Psalms 51',
        'Psalms 63', 'Psalms 86', 'Psalms 139', '1 Kings 8', '2 Chronicles 7',
        'Nehemiah 1', 'Daniel 9', 'Acts 4', 'John 17', 'Romans 8',
        'Ephesians 3', 'Philippians 4', 'Colossians 1', '1 Thessalonians 5',
        'Hebrews 4', 'James 5',
      ],
    }),
    curated({
      id: 'identity-21',
      title: 'Who you are in Christ',
      description:
        'Three weeks on what is said to be true of you already, rather than what you are told to become.',
      category: 'For where you are',
      days: [
        'Genesis 1', 'Psalms 139', 'Isaiah 43', 'John 1', 'John 15',
        'Romans 6', 'Romans 8', 'Romans 12', '1 Corinthians 6', '2 Corinthians 5',
        'Galatians 2', 'Galatians 3', 'Ephesians 1', 'Ephesians 2', 'Ephesians 4',
        'Philippians 3', 'Colossians 3', 'Titus 3', 'Hebrews 4', '1 Peter 2',
        '1 John 3',
      ],
    }),
    curated({
      id: 'forgiveness-14',
      title: 'Forgiveness',
      description:
        'Two weeks on being forgiven and on forgiving — which the Bible refuses to treat as separate subjects.',
      category: 'For where you are',
      days: [
        'Genesis 50', 'Psalms 32', 'Psalms 51', 'Psalms 103', 'Isaiah 1',
        'Micah 7', 'Matthew 6', 'Matthew 18', 'Luke 15', 'Luke 23',
        'Romans 5', 'Ephesians 4', 'Colossians 3', '1 John 1',
      ],
    }),
    curated({
      id: 'marriage-14',
      title: 'Marriage & family',
      description:
        'Two weeks for couples and households — including the passages usually quoted at weddings, read in full rather than in fragments.',
      category: 'For where you are',
      days: [
        'Genesis 2', 'Deuteronomy 6', 'Psalms 127', 'Psalms 128', 'Proverbs 5',
        'Proverbs 31', 'Song of Solomon 2', 'Song of Solomon 8', 'Malachi 2',
        'Matthew 19', '1 Corinthians 13', 'Ephesians 5', 'Colossians 3', '1 Peter 3',
      ],
    }),
    curated({
      id: 'money-work-14',
      title: 'Money & work',
      description:
        'Two weeks on earning, giving, debt and contentment — a subject the Bible is far blunter about than most preaching on it.',
      category: 'For where you are',
      days: [
        'Proverbs 3', 'Proverbs 6', 'Proverbs 11', 'Proverbs 13', 'Ecclesiastes 5',
        'Malachi 3', 'Matthew 6', 'Luke 12', 'Luke 16', '2 Corinthians 9',
        'Colossians 3', '1 Timothy 6', 'Hebrews 13', 'James 5',
      ],
    }),
  ];

  const planIds = new Set();
  for (const template of templates) {
    if (planIds.has(template.id)) throw new Error(`duplicate plan id: ${template.id}`);
    planIds.add(template.id);
    if (!template.days.length) throw new Error(`${template.id} has no days`);
  }

  const header = `// GENERATED by scripts/build-plan-templates.mjs — do not edit by hand.
//
// Starter plans, so the plans screen is not an empty room for someone who has
// just installed the app and knows nobody using it. Every reference below was
// generated from the bundled text, so every day points at a real passage.
//
// \`category\` groups them on the plans screen. A flat list of this many plans
// is a wall; grouped, someone can find the one that fits where they are.

export type PlanTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  days: { reference: string }[];
};

export const PLAN_TEMPLATES: PlanTemplate[] = ${JSON.stringify(templates, null, 2)};

/** Categories in the order they should appear, with their plans. */
export const PLAN_CATEGORIES: { name: string; plans: PlanTemplate[] }[] = (() => {
  const order: string[] = [];
  const grouped = new Map<string, PlanTemplate[]>();

  for (const template of PLAN_TEMPLATES) {
    if (!grouped.has(template.category)) {
      grouped.set(template.category, []);
      order.push(template.category);
    }
    grouped.get(template.category)!.push(template);
  }

  return order.map((name) => ({ name, plans: grouped.get(name)! }));
})();
`;

  await writeFile(path.join(root, 'constants', 'plan-templates.ts'), header, 'utf8');

  let lastCategory = '';
  for (const t of templates) {
    if (t.category !== lastCategory) {
      console.log(`\n${t.category}`);
      lastCategory = t.category;
    }
    console.log(`  ${t.days.length.toString().padStart(3)} days  ${t.title}`);
  }
  console.log(`\n${templates.length} plans · ${templates.reduce((n, t) => n + t.days.length, 0)} days`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
