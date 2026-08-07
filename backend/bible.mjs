import { config } from './config.mjs';

/**
 * API.Bible proxy.
 *
 * Copyrighted translations (NKJV, NLT, AMP …) are licensed through API.Bible
 * rather than being freely fetchable. The key is a licensing credential, so it
 * stays here — embedding it in the app would hand it to anyone who unpacked the
 * bundle, and misuse is charged to your account.
 *
 * Public-domain translations still go straight from the device to
 * bible-api.com; there is nothing to protect there and no reason to add a hop.
 */

const API_BASE = 'https://api.scripture.api.bible/v1';
const TIMEOUT_MS = 10_000;

export function isBibleApiConfigured() {
  return Boolean(config.apiBibleKey);
}

async function apiBible(path) {
  if (!config.apiBibleKey) {
    throw new Error('API_BIBLE_KEY is not set');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: { 'api-key': config.apiBibleKey },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      // Never let the key surface in an error string.
      throw new Error(`API.Bible responded ${response.status}: ${detail.slice(0, 200)}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Bibles this key is licensed for — used to populate the picker. */
export async function listBibles() {
  const payload = await apiBible('/bibles?language=eng');

  return (payload.data ?? []).map((bible) => ({
    id: bible.id,
    abbreviation: bible.abbreviationLocal || bible.abbreviation,
    name: bible.name,
    description: bible.description ?? '',
    language: bible.language?.name ?? 'English',
    copyright: bible.copyright ?? '',
  }));
}

/**
 * API.Bible chapter ids look like `JHN.3`, using the same three-letter book
 * codes we already use — uppercased.
 */
function toChapterId(bookId, chapter) {
  return `${bookId.toUpperCase()}.${chapter}`;
}

/**
 * A chapter as an array of verse strings.
 *
 * The API returns HTML or a single text blob rather than discrete verses, so
 * the text is split on verse numbers to match the shape the reader expects
 * from every other source.
 */
export async function getChapter(bibleId, bookId, chapter) {
  const payload = await apiBible(
    `/bibles/${encodeURIComponent(bibleId)}/chapters/${toChapterId(bookId, chapter)}` +
      '?content-type=text&include-verse-numbers=true&include-notes=false' +
      '&include-titles=false&include-chapter-numbers=false'
  );

  const content = payload.data?.content ?? '';

  // Verses arrive as "[1] In the beginning … [2] And the earth …".
  const parts = content.split(/\[(\d+)\]/).filter((part) => part.trim());
  const verses = [];

  for (let i = 0; i < parts.length; i += 2) {
    const number = Number(parts[i]);
    const text = (parts[i + 1] ?? '').replace(/\s+/g, ' ').trim();
    if (Number.isInteger(number) && text) {
      verses.push({ verse: number, text });
    }
  }

  // Fall back to one block rather than returning nothing if the shape changes.
  if (verses.length === 0 && content.trim()) {
    return {
      verses: [{ verse: 1, text: content.replace(/\s+/g, ' ').trim() }],
      copyright: payload.data?.copyright ?? '',
    };
  }

  return { verses, copyright: payload.data?.copyright ?? '' };
}
