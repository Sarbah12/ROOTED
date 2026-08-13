import { BOOK_NAMES } from './books.mjs';
import { config } from './config.mjs';

/**
 * New Living Translation, straight from Tyndale.
 *
 * Tyndale publish the NLT and run their own API for it (api.nlt.to), which is
 * a better arrangement than reaching it through an aggregator: higher limits,
 * and a licence conversation with the people who actually own the text. The
 * key is a licensing credential, so it stays on the server.
 *
 * Two traps this module exists to absorb:
 *
 *   1. The API answers in HTML, not JSON — verse numbers, translator
 *      footnotes and section headings all inline — so it has to be parsed
 *      into the verse array every other source in the app returns.
 *
 *   2. `version` is not optional in practice. Ask for "Genesis.1" without it
 *      and the answer comes back as Génesis, in Spanish, because the ref
 *      matches a Spanish book name first.
 */

const API_BASE = 'https://api.nlt.to/api';
const TIMEOUT_MS = 12_000;

/** Tyndale's limit is 5,000 requests a day, and chapters do not change. */
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX = 400;
const cache = new Map();

export function isNltConfigured() {
  return Boolean(config.nltApiKey);
}

/**
 * Book names as Tyndale's parser expects them. All 66 of the app's own names
 * were checked against the live API; only one disagreed, so only one is
 * listed here rather than duplicating a book table that already exists.
 */
const BOOK_NAME_OVERRIDES = {
  sng: 'Song of Songs',
};

/**
 * Removes an element and everything inside it, counting nested tags of the
 * same name. A plain non-greedy regex stops at the first close tag, which for
 * a footnote like `<span class="tn"><span class="tn-ref">1:5</span> Greek …`
 * would leave the footnote body behind in the middle of the verse.
 */
function stripElement(html, openPattern, tagName) {
  const open = new RegExp(openPattern, 'i');
  const step = new RegExp(`<${tagName}\\b|</${tagName}>`, 'gi');

  let out = html;
  for (;;) {
    const start = out.search(open);
    if (start === -1) return out;

    step.lastIndex = start;
    let depth = 0;
    let end = -1;
    let match;

    while ((match = step.exec(out))) {
      depth += match[0][1] === '/' ? -1 : 1;
      if (depth === 0) {
        end = match.index + match[0].length;
        break;
      }
    }

    // Unbalanced markup: drop the opening tag alone rather than looping.
    if (end === -1) return out.replace(open, '');
    out = out.slice(0, start) + out.slice(end);
  }
}

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#39;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);
}

/** One verse of HTML down to one line of readable text. */
function verseText(html) {
  let text = html;

  // Order matters: footnote bodies and section headings must go before the
  // generic tag strip, or their words end up inside the verse.
  text = stripElement(text, '<span[^>]*class="[^"]*\\btn\\b[^"]*"[^>]*>', 'span');
  text = stripElement(text, '<h[234][^>]*>', 'h[234]');
  text = text.replace(/<a\b[^>]*class="[^"]*a-tn[^"]*"[^>]*>.*?<\/a>/gi, '');
  text = text.replace(/<span[^>]*class="[^"]*\bvn\b[^"]*"[^>]*>.*?<\/span>/gi, '');

  // Poetry is laid out one line per <p>; joined with spaces it reads as prose.
  text = text.replace(/<\/(p|div)>/gi, ' ');
  text = text.replace(/<[^>]+>/g, '');

  return decode(text).replace(/\s+/g, ' ').trim();
}

async function request(ref) {
  const url =
    `${API_BASE}/passages?ref=${encodeURIComponent(ref)}` +
    `&version=NLT&key=${encodeURIComponent(config.nltApiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      // Never let the key surface in an error string.
      throw new Error(`NLT API responded ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A chapter as `{ verses: [{ verse, text }], copyright }`, the same shape the
 * bundled text and every other provider return.
 */
export async function getNltChapter(bookId, chapter) {
  if (!config.nltApiKey) {
    throw new Error('NLT_API_KEY is not set');
  }

  const name = BOOK_NAME_OVERRIDES[bookId] ?? BOOK_NAMES[bookId];
  if (!name) {
    throw new Error(`Unknown book: ${bookId}`);
  }

  const ref = `${name}.${chapter}`;

  const cached = cache.get(ref);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const html = await request(ref);
  const verses = [];

  const blocks = html.matchAll(/<verse_export\b[^>]*\bvn="(\d+)"[^>]*>([\s\S]*?)<\/verse_export>/gi);
  for (const [, number, body] of blocks) {
    const text = verseText(body);
    if (text) verses.push({ verse: Number(number), text });
  }

  if (verses.length === 0) {
    throw new Error(`No NLT text returned for ${ref}`);
  }

  const value = {
    verses,
    copyright:
      'Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by ' +
      'Tyndale House Foundation. Used by permission of Tyndale House Publishers.',
  };

  // Oldest out first; chapters are small and this only exists to stay under
  // the daily request limit.
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(ref, { at: Date.now(), value });

  return value;
}
