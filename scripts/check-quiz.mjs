/**
 * Validates the quiz bank against the bundled KJV.
 *
 *   node scripts/check-quiz.mjs
 *
 * A quiz question with a wrong reference is worse than no question at all: it
 * teaches the wrong thing and quietly undermines every other answer. This
 * checks what can actually be checked mechanically —
 *
 *   - the book id exists
 *   - the chapter exists in that book
 *   - the verse exists in that chapter
 *   - the answer is one of the options
 *   - ids are unique
 *   - every book has enough questions to appear as a subject
 *
 * It cannot check that an answer is *true*. That still needs a human reading
 * the verse, so the failing references it prints are the shortlist to read.
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'assets', 'bible', 'kjv');

const MIN_PER_BOOK = 3;

/** Pulls the question literals out of the TypeScript without compiling it. */
async function loadQuestions() {
  const bank =
    (await readFile(path.join(root, 'constants', 'quiz-bank.ts'), 'utf8')) +
    (await readFile(path.join(root, 'constants', 'quiz-topics.ts'), 'utf8'));
  const core = await readFile(path.join(root, 'constants', 'quiz.ts'), 'utf8');

  const questions = [];

  // quiz-bank.ts: q('id', 'question', [options], answerIndex, 'reference', ...)
  for (const match of bank.matchAll(
    /q\(\s*'([^']+)',\s*'((?:[^'\\]|\\.)*)',\s*\[([\s\S]*?)\],\s*(\d+),\s*'([^']+)',\s*'(\w+)',\s*'([^']+)'/g,
  )) {
    const [, id, , optionsRaw, answerIndex, reference, difficulty, bookId] = match;
    const options = [...optionsRaw.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((o) => o[1]);
    questions.push({
      id,
      options,
      answerIndex: Number(answerIndex),
      reference,
      difficulty,
      bookId,
      source: 'quiz-bank.ts',
    });
  }

  // quiz.ts: object literals.
  for (const match of core.matchAll(
    /\{\s*id:\s*'([^']+)',[\s\S]*?options:\s*\[([\s\S]*?)\],\s*answer:\s*'((?:[^'\\]|\\.)*)',\s*reference:\s*'([^']+)',\s*difficulty:\s*'(\w+)',\s*bookId:\s*'([^']+)'/g,
  )) {
    const [, id, optionsRaw, answer, reference, difficulty, bookId] = match;
    const options = [...optionsRaw.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((o) => o[1]);
    questions.push({
      id,
      options,
      answerIndex: options.indexOf(answer),
      reference,
      difficulty,
      bookId,
      source: 'quiz.ts',
    });
  }

  return questions;
}

async function main() {
  const booksSrc = await readFile(path.join(root, 'constants', 'bible-books.ts'), 'utf8');
  const books = JSON.parse(
    booksSrc.match(/export const BIBLE_BOOKS: BibleBook\[\] = (\[[\s\S]*?\n\]);/)[1],
  );
  const byId = Object.fromEntries(books.map((b) => [b.id, b]));
  const byName = Object.fromEntries(books.map((b) => [b.name.toLowerCase(), b]));
  // References are written the way people say them: "Psalm 23:1", not "Psalms".
  byName.psalm = byName.psalms;
  byName['song of songs'] = byName['song of solomon'];

  const files = new Set(await readdir(bundleDir));
  const chapters = {};
  for (const book of books) {
    if (files.has(`${book.id}.json`)) {
      chapters[book.id] = JSON.parse(await readFile(path.join(bundleDir, `${book.id}.json`), 'utf8'));
    }
  }

  const questions = await loadQuestions();
  const problems = [];
  const seen = new Set();
  const perBook = {};

  for (const item of questions) {
    const where = `${item.source} ${item.id}`;

    if (seen.has(item.id)) problems.push(`${where}: duplicate id`);
    seen.add(item.id);

    if (!byId[item.bookId]) {
      problems.push(`${where}: unknown bookId '${item.bookId}'`);
      continue;
    }
    perBook[item.bookId] = (perBook[item.bookId] ?? 0) + 1;

    if (item.answerIndex < 0 || item.answerIndex >= item.options.length) {
      problems.push(`${where}: answer is not one of the options`);
    }
    if (new Set(item.options).size !== item.options.length) {
      problems.push(`${where}: duplicate options`);
    }
    if (item.options.length < 2) {
      problems.push(`${where}: fewer than two options`);
    }
    if (!['Easy', 'Medium', 'Hard'].includes(item.difficulty)) {
      problems.push(`${where}: bad difficulty '${item.difficulty}'`);
    }

    // Accepts "1 Samuel 17:49", a verse range "Matthew 6:9-13", and a whole
    // chapter "Psalm 51". Only the first verse is checked to exist; a range
    // that starts inside the chapter is good enough to catch typos.
    const ref =
      item.reference.match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*\d+)?$/) ||
      // A whole chapter, or a span of them: "Psalm 51", "Exodus 7-12".
      item.reference.match(/^(.+?)\s+(\d+)(?:\s*-\s*\d+)?()$/);
    if (!ref) {
      problems.push(`${where}: cannot parse reference '${item.reference}'`);
      continue;
    }

    const [, nameRaw, chapterRaw, verseRaw] = ref;
    const verseGiven = verseRaw !== '';
    const book = byName[nameRaw.toLowerCase()];
    if (!book) {
      problems.push(`${where}: unknown book in reference '${item.reference}'`);
      continue;
    }
    if (book.id !== item.bookId) {
      problems.push(`${where}: reference '${item.reference}' does not match bookId '${item.bookId}'`);
      continue;
    }

    const chapter = Number(chapterRaw);
    const verse = verseGiven ? Number(verseRaw) : 1;
    const text = chapters[book.id]?.[chapter - 1]?.[verse - 1];

    if (!chapters[book.id]) {
      problems.push(`${where}: no bundled text for ${book.name}`);
    } else if (!chapters[book.id][chapter - 1]) {
      problems.push(`${where}: ${book.name} has no chapter ${chapter}`);
    } else if (!text) {
      problems.push(
        `${where}: ${book.name} ${chapter} has no verse ${verse} ` +
          `(chapter has ${chapters[book.id][chapter - 1].length})`,
      );
    }
  }

  const thin = books
    .filter((b) => (perBook[b.id] ?? 0) < MIN_PER_BOOK)
    .map((b) => `${b.name} (${perBook[b.id] ?? 0})`);

  console.log(`questions: ${questions.length}`);
  console.log(`books covered: ${Object.keys(perBook).length} / ${books.length}`);
  console.log(`fewest in one book: ${Math.min(...books.map((b) => perBook[b.id] ?? 0))}`);

  if (thin.length) {
    console.log(`\nbelow the ${MIN_PER_BOOK}-question threshold to show as a subject:`);
    thin.forEach((t) => console.log('  ', t));
  }

  if (problems.length) {
    console.log(`\n${problems.length} PROBLEM(S):`);
    problems.forEach((p) => console.log('  ', p));
    process.exit(1);
  }

  console.log('\nAll references resolve in the bundled KJV.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
