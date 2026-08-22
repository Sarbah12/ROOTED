/**
 * Runs every check the project knows how to run.
 *
 *   npm run check        report only
 *   npm run check -- --fix   apply what can be applied automatically
 *
 * Existing because the things that have actually gone wrong here were not
 * caught by typechecking. Six verses were missing from the bundled Bible, a
 * fifth of it carried editorial notes presented as Scripture, a quiz question
 * pointed at a verse that did not exist, and a plan named a chapter a book did
 * not have. Every one of those compiled cleanly.
 *
 * Each check is cheap and offline. The Bible-against-a-second-source audit is
 * deliberately not here — it makes 1,189 network requests and belongs in
 * scripts/check-bible-bundle.mjs, run when the bundle changes.
 */

import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = process.argv.includes('--fix');

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name.padEnd(30)} ${detail}`);
}

async function tryRun(name, file, args, ok = 'clean') {
  try {
    const { stdout } = await run(file, args, { cwd: root, maxBuffer: 20e6 });
    record(name, true, ok);
    return stdout;
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n');
    record(name, false, out.slice(0, 2).join(' / ').slice(0, 120));
    return null;
  }
}

// ---------------------------------------------------------------- the checks

async function checkTypes() {
  await tryRun('TypeScript', 'npx', ['tsc', '--noEmit'], '0 errors');
}

async function checkLint() {
  await tryRun('Lint', 'npx', FIX ? ['expo', 'lint', '--fix'] : ['expo', 'lint'],
    FIX ? 'clean (fixes applied)' : 'clean');
}

async function checkBackendSyntax() {
  const dir = path.join(root, 'backend');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs'));
  const bad = [];

  for (const file of files) {
    try {
      await run(process.execPath, ['--check', path.join(dir, file)]);
    } catch {
      bad.push(file);
    }
  }

  record('Backend syntax', bad.length === 0, bad.length ? bad.join(', ') : `${files.length} files parse`);
}

/** The bundled text: complete, and free of the translators' apparatus. */
async function checkBible() {
  // Every translation that ships inside the app. The KJV verse count is exact
  // because it is a known edition; the others only have to be complete —
  // translations legitimately differ on where a verse boundary falls.
  const EXPECTED = {
    kjv: 31102,
    'twi-akuapem': null,
    'twi-asante': null,
  };
  const NOTE = /\.\.\.:\s|:\s(Heb|Gr|Chal)\.\s/;

  const summaries = [];
  const problems = [];

  for (const [translation, expectedVerses] of Object.entries(EXPECTED)) {
    const dir = path.join(root, 'assets', 'bible', translation);
    let files;
    try {
      files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
    } catch {
      problems.push(`${translation}: not bundled`);
      continue;
    }

    let chapters = 0;
    let verses = 0;
    let apparatus = 0;
    let empty = 0;

    for (const file of files) {
      const book = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
      chapters += book.length;
      for (const chapter of book) {
        const present = chapter.filter((verse) => verse.length > 0);
        if (present.length === 0) empty += 1;
        verses += present.length;
        // Only the KJV carries the apparatus this pattern looks for; running
        // it over the others would flag ordinary Twi punctuation.
        if (translation === 'kjv') {
          for (const verse of present) if (NOTE.test(verse)) apparatus += 1;
        }
      }
    }

    if (files.length !== 66) problems.push(`${translation}: ${files.length} books, expected 66`);
    if (chapters !== 1189) problems.push(`${translation}: ${chapters} chapters, expected 1189`);
    if (empty) problems.push(`${translation}: ${empty} empty chapters`);
    if (apparatus) problems.push(`${translation}: ${apparatus} verses carry apparatus`);
    if (expectedVerses !== null && verses !== expectedVerses) {
      problems.push(`${translation}: ${verses} verses, expected ${expectedVerses}`);
    }

    summaries.push(`${translation} ${verses}`);
  }

  record(
    'Bible bundle',
    problems.length === 0,
    problems.length ? problems.join('; ') : `${summaries.length} bundled · 1189 chapters each · ${summaries.join(' · ')} verses`,
  );
}

/** Every quiz reference, plan reference and verse-pool entry must resolve. */
async function checkReferences() {
  const booksSrc = await readFile(path.join(root, 'constants', 'bible-books.ts'), 'utf8');
  const books = JSON.parse(
    booksSrc.match(/export const BIBLE_BOOKS: BibleBook\[\] = (\[[\s\S]*?\n\]);/)[1],
  );
  const byName = Object.fromEntries(books.map((b) => [b.name.toLowerCase(), b]));
  byName.psalm = byName.psalms;
  byName['song of songs'] = byName['song of solomon'];

  // Plan templates
  const planSrc = await readFile(path.join(root, 'constants', 'plan-templates.ts'), 'utf8');
  const templates = JSON.parse(planSrc.match(/PLAN_TEMPLATES: PlanTemplate\[\] = (\[[\s\S]*\]);/)[1]);

  let planRefs = 0;
  const badPlans = [];

  for (const template of templates) {
    for (const day of template.days) {
      for (const part of day.reference.split(' · ')) {
        planRefs += 1;
        const match = part.match(/^(.+?) (\d+)(?:-(\d+))?$/);
        const book = match && byName[match[1].toLowerCase()];
        if (!book) badPlans.push(part);
        else if (Number(match[3] || match[2]) > book.chapters) badPlans.push(part);
      }
    }
  }

  // A day whose reference parses to no chapters shows no scripture at all,
  // which is how most plan days silently displayed nothing.
  const unreadable = [];
  for (const template of templates) {
    for (const day of template.days) {
      const chapters = day.reference.split(/\s*[·;]\s*/).filter((part) => {
        const m = part.trim().match(/^(.+?)\s+(\d+)(?:\s*[-–]\s*(\d+))?$/);
        return m && byName[m[1].trim().toLowerCase()];
      });
      if (chapters.length === 0) unreadable.push(`${template.id}: ${day.reference}`);
    }
  }

  record('Plan templates', badPlans.length === 0 && unreadable.length === 0,
    `${templates.length} plans · ${planRefs} references · ${unreadable.length} unreadable` +
      (badPlans.length ? ` · bad: ${badPlans.slice(0, 3)}` : ''));

  // Verse pool: must resolve, and must still be a full-cycle permutation.
  const poolSrc = await readFile(path.join(root, 'constants', 'verse-pool.ts'), 'utf8');
  const pool = JSON.parse(
    poolSrc.match(/VERSE_POOL: PoolEntry\[\] = (\[[\s\S]*\]);/)[1].replace(/,\n\]/, ']'),
  );

  const cache = {};
  let unresolved = 0;
  for (const [bookId, chapter, verse] of pool) {
    cache[bookId] ??= JSON.parse(
      await readFile(path.join(root, 'assets', 'bible', 'kjv', `${bookId}.json`), 'utf8'),
    );
    if (!cache[bookId]?.[chapter - 1]?.[verse - 1]) unresolved += 1;
  }

  const n = pool.length;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  let stride = Math.floor(n * 0.618) | 1;
  while (stride > 1 && gcd(stride, n) !== 1) stride -= 2;
  const seen = new Set();
  for (let d = 0; d < n; d += 1) seen.add((d * stride) % n);

  record('Verse rotation', unresolved === 0 && seen.size === n,
    `${n} verses · ${(n / 365).toFixed(1)} years · ${seen.size}/${n} distinct in a cycle`);
}

/** Quiz questions, via the dedicated script so there is one implementation. */
async function checkQuiz() {
  const out = await tryRun('Quiz bank', process.execPath, [path.join(root, 'scripts', 'check-quiz.mjs')]);
  if (out) {
    const line = out.split('\n').find((l) => l.startsWith('questions:'));
    if (line) results[results.length - 1].detail = line.replace('questions:', '').trim() + ' questions, all resolve';
  }
}

/** Things that must never reach the repository. */
async function checkSecrets() {
  const patterns = [
    [/re_[A-Za-z0-9_]{20,}/, 'Resend key'],
    [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  ];

  const { stdout } = await run('git', ['ls-files'], { cwd: root });
  const files = stdout.split('\n').filter((f) => /\.(ts|tsx|mjs|js|json|md)$/.test(f));

  /**
   * Files that legitimately contain something matching a pattern.
   *
   * A Firebase *web* API key is not a secret. It identifies the project and is
   * meant to ship in client code; access is controlled by Firebase security
   * rules, not by hiding it. Treating it as a leak trains people to ignore this
   * check, which is worse than not having it.
   *
   * STATUS.md names truncated keys on purpose, as a rotation list.
   */
  const expected = ['constants/firebase.ts', 'docs/STATUS.md'];

  const hits = [];
  for (const file of files) {
    if (expected.includes(file)) continue;
    let text;
    try {
      text = await readFile(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    for (const [pattern, label] of patterns) {
      // The status doc names truncated keys deliberately, as a rotation list.
      if (pattern.test(text)) hits.push(`${label} in ${file}`);
    }
  }

  record('No secrets committed', hits.length === 0, hits.length ? hits.join(', ') : `${files.length} tracked files scanned`);
}

async function main() {
  console.log(`\nRooted — full check${FIX ? ' (fixing what can be fixed)' : ''}\n`);

  await checkTypes();
  await checkLint();
  await checkBackendSyntax();
  await checkBible();
  await checkReferences();
  await checkQuiz();
  await checkSecrets();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);

  if (failed.length) {
    console.log(`\nfailing: ${failed.map((f) => f.name).join(', ')}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
