/**
 * Checks that every translation in the picker can actually load a chapter.
 *
 *   node scripts/check-versions.mjs            everything
 *   API_BIBLE_KEY=... node scripts/check-versions.mjs
 *
 * Separate from `npm run check` because it goes to the network, and because
 * bible-api.com rate-limits hard enough that running it too often is itself
 * the reason a translation appears broken. Requests to it are paced.
 *
 * A translation badged `full` that answers for John but not Genesis — or the
 * reverse — is a coverage lie, and that is the bug this is looking for.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.API_BIBLE_KEY;
const PACE_MS = 4000;

async function main() {
  const src = await readFile(path.join(root, 'constants', 'bible-translations.ts'), 'utf8');
  const entries = [...src.matchAll(/\{\s*\n\s*id: '([^']+)',[\s\S]*?\n  \}/g)].map((m) => {
    const b = m[0];
    const get = (k) => (b.match(new RegExp(`${k}: '([^']*)'`)) || [])[1];
    return { id: m[1], abbr: get('abbr'), provider: get('provider'),
             apiId: get('apiId'), bibleId: get('bibleId'), coverage: get('coverage') };
  });

  const problems = [];

  for (const t of entries) {
    if (t.provider === 'bundled') continue;

    // A "full" Bible must answer for both testaments; "nt" only for the New.
    const refs = t.coverage === 'full' ? [['gen', 'genesis', 1], ['jhn', 'john', 3]]
                                       : [['jhn', 'john', 3]];
    const results = [];

    for (const [bookId, bookName, chapter] of refs) {
      try {
        if (t.provider === 'public') {
          const r = await fetch(`https://bible-api.com/${bookName}+${chapter}?translation=${t.apiId}`,
            { signal: AbortSignal.timeout(20000) });
          results.push(r.ok ? (await r.json()).verses?.length ?? 0 : `HTTP ${r.status}`);
          await new Promise((s) => setTimeout(s, PACE_MS));
        } else {
          if (!KEY) { results.push('no key'); continue; }
          const r = await fetch(
            `https://rest.api.bible/v1/bibles/${t.bibleId}/chapters/${bookId.toUpperCase()}.${chapter}?content-type=text`,
            { headers: { 'api-key': KEY }, signal: AbortSignal.timeout(20000) });
          results.push(r.ok ? 'ok' : `HTTP ${r.status}`);
          await new Promise((s) => setTimeout(s, 250));
        }
      } catch (error) {
        results.push(error.message.slice(0, 30));
      }
    }

    const bad = results.some((r) => typeof r === 'string' ? r !== 'ok' : r < 5);
    console.log(`${bad ? ' FAIL ' : '  ok  '} ${(t.abbr || t.id).padEnd(12)} ${t.provider.padEnd(9)} ${t.coverage.padEnd(5)} ${results.join(' / ')}`);
    if (bad) problems.push(`${t.abbr} (${t.provider}): ${results.join(' / ')}`);
  }

  console.log(`\n${entries.length - 1 - problems.length}/${entries.length - 1} load`);
  if (problems.length) {
    console.log('\nPROBLEMS:');
    problems.forEach((p) => console.log('  ', p));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
