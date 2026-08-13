/**
 * In-memory cache for licensed chapters.
 *
 * Every licensed provider is metered, and the meters are tight: API.Bible's
 * free tier allows 5,000 calls a *month*, and Tyndale's free key 5,000 a day.
 * Without caching, five thousand people opening John 3 is five thousand calls
 * for one chapter of text that has not changed since it was written.
 *
 * Deliberately in memory rather than in Postgres. A growing copy of licensed
 * text on disk starts to look like redistribution rather than caching, which
 * is a conversation to have with the publisher before having it with a
 * lawyer. A process-lifetime cache is unambiguous, and it absorbs the traffic
 * that matters — many people reading the same chapter on the same day.
 */

const TTL_MS = 12 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

const store = new Map();

export function readCache(key) {
  const hit = store.get(key);
  if (!hit) return null;

  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return null;
  }

  // Refresh insertion order so the busiest chapters survive eviction.
  store.delete(key);
  store.set(key, hit);
  return hit.value;
}

export function writeCache(key, value) {
  if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order, so the first key is the least recently
    // used one.
    store.delete(store.keys().next().value);
  }
  store.set(key, { at: Date.now(), value });
  return value;
}

/** Exposed so a health or admin view can show how well the cache is working. */
export function cacheSize() {
  return store.size;
}
