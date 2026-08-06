import { query, queryOne } from './db.mjs';

/**
 * Data access, scoped per user.
 *
 * This replaced a single JSON file that held one global `notes` and `prayers`
 * array — every signed-in account saw the same rows. Everything here takes a
 * userId and filters on it, so accounts are actually isolated.
 *
 * Row shapes are mapped to the camelCase the API already returns, so the client
 * did not change.
 */

// ------------------------------------------------------------------ mapping
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    username: row.username ?? null,
    phone: {
      countryCode: row.phone_country_code || '',
      number: row.phone_number || '',
    },
    provider: row.provider,
    photoURL: row.photo_url,
    emailVerified: row.email_verified,
  };
}

function mapSettings(row) {
  if (!row) return null;
  return {
    darkMode: row.dark_mode,
    remindersEnabled: row.reminders_enabled,
    verseNotificationsEnabled: row.verse_notifications_enabled,
    streakBadgeEnabled: row.streak_badge_enabled,
    reminderTime: row.reminder_time,
    fontSize: row.font_size,
  };
}

function mapNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    reference: row.reference,
    content: row.content,
    tags: row.tags ?? [],
    color: row.color,
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapPrayer(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    status: row.status,
    verse: row.verse,
    updatedAt: row.updated_at.toISOString(),
  };
}

// Sign-in identifiers are mapped onto synthetic addresses by the app (see
// constants/identity.ts). Unpick them so the real username or phone number is
// stored rather than the internal address.
const USERNAME_DOMAIN = '@users.rootedbible.app';
const PHONE_DOMAIN = '@phone.rootedbible.app';

function splitIdentity(email) {
  if (!email) return { username: null, phoneDigits: null, realEmail: null };
  if (email.endsWith(USERNAME_DOMAIN)) {
    return { username: email.slice(0, -USERNAME_DOMAIN.length), phoneDigits: null, realEmail: null };
  }
  if (email.endsWith(PHONE_DOMAIN)) {
    return { username: null, phoneDigits: email.slice(0, -PHONE_DOMAIN.length), realEmail: null };
  }
  return { username: null, phoneDigits: null, realEmail: email };
}

// -------------------------------------------------------------------- users
/** Upserts the profile on every login so Firebase stays the source of truth. */
export async function upsertUser(firebaseUser) {
  const identity = splitIdentity(firebaseUser.email);

  const row = await queryOne(
    `insert into users
     (id, display_name, email, phone_country_code, phone_number,
      provider, photo_url, email_verified, username)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (id) do update set
       display_name       = excluded.display_name,
       email              = excluded.email,
       phone_country_code = excluded.phone_country_code,
       phone_number       = excluded.phone_number,
       provider           = excluded.provider,
       photo_url          = excluded.photo_url,
       email_verified     = excluded.email_verified,
       username           = coalesce(excluded.username, users.username)
     returning *`,
    [
      firebaseUser.uid,
      firebaseUser.displayName || 'Guest Reader',
      identity.realEmail,
      firebaseUser.phone?.countryCode || '',
      identity.phoneDigits || firebaseUser.phone?.number || '',
      firebaseUser.provider || 'firebase',
      firebaseUser.photoURL,
      Boolean(firebaseUser.emailVerified),
      identity.username,
    ]
  );

  // Give every new account a settings row so reads never come back empty.
  await query(
    `insert into user_settings (user_id) values ($1) on conflict (user_id) do nothing`,
    [firebaseUser.uid]
  );

  return mapUser(row);
}

export async function getUser(userId) {
  return mapUser(await queryOne('select * from users where id = $1', [userId]));
}

// ----------------------------------------------------------------- settings
export async function getSettings(userId) {
  const row = await queryOne('select * from user_settings where user_id = $1', [userId]);
  if (row) return mapSettings(row);

  const created = await queryOne(
    'insert into user_settings (user_id) values ($1) returning *',
    [userId]
  );
  return mapSettings(created);
}

const SETTINGS_COLUMNS = {
  darkMode: 'dark_mode',
  remindersEnabled: 'reminders_enabled',
  verseNotificationsEnabled: 'verse_notifications_enabled',
  streakBadgeEnabled: 'streak_badge_enabled',
  reminderTime: 'reminder_time',
  fontSize: 'font_size',
};

export async function updateSettings(userId, patch) {
  const sets = [];
  const values = [userId];

  for (const [key, column] of Object.entries(SETTINGS_COLUMNS)) {
    if (patch[key] !== undefined) {
      values.push(patch[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }

  if (sets.length === 0) {
    return getSettings(userId);
  }

  await getSettings(userId); // ensure the row exists

  const row = await queryOne(
    `update user_settings set ${sets.join(', ')} where user_id = $1 returning *`,
    values
  );
  return mapSettings(row);
}

// -------------------------------------------------------------------- notes
export async function listNotes(userId) {
  const { rows } = await query(
    'select * from notes where user_id = $1 order by updated_at desc',
    [userId]
  );
  return rows.map(mapNote);
}

export async function createNote(userId, input) {
  const row = await queryOne(
    `insert into notes (user_id, title, reference, content, tags, color)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      userId,
      input.title,
      input.reference ?? '',
      input.content ?? '',
      input.tags ?? [],
      input.color ?? '#2E6A5C',
    ]
  );
  return mapNote(row);
}

export async function updateNote(userId, id, patch) {
  const columns = { title: 'title', reference: 'reference', content: 'content', tags: 'tags', color: 'color' };
  const sets = [];
  const values = [userId, id];

  for (const [key, column] of Object.entries(columns)) {
    if (patch[key] !== undefined) {
      values.push(patch[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }

  // Touch updated_at even when the patch is empty, so sync ordering holds.
  if (sets.length === 0) sets.push('updated_at = now()');

  const row = await queryOne(
    `update notes set ${sets.join(', ')} where user_id = $1 and id = $2 returning *`,
    values
  );
  return mapNote(row);
}

export async function deleteNote(userId, id) {
  const row = await queryOne(
    'delete from notes where user_id = $1 and id = $2 returning id',
    [userId, id]
  );
  return Boolean(row);
}

// ------------------------------------------------------------------ prayers
export async function listPrayers(userId) {
  const { rows } = await query(
    'select * from prayers where user_id = $1 order by updated_at desc',
    [userId]
  );
  return rows.map(mapPrayer);
}

export async function createPrayer(userId, input) {
  const row = await queryOne(
    `insert into prayers (user_id, title, category, content, status, verse)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      userId,
      input.title,
      input.category ?? 'Personal',
      input.content ?? '',
      input.status ?? 'unanswered',
      input.verse ?? '',
    ]
  );
  return mapPrayer(row);
}

export async function updatePrayer(userId, id, patch) {
  const columns = {
    title: 'title',
    category: 'category',
    content: 'content',
    status: 'status',
    verse: 'verse',
  };
  const sets = [];
  const values = [userId, id];

  for (const [key, column] of Object.entries(columns)) {
    if (patch[key] !== undefined) {
      values.push(patch[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }

  if (sets.length === 0) sets.push('updated_at = now()');

  const row = await queryOne(
    `update prayers set ${sets.join(', ')} where user_id = $1 and id = $2 returning *`,
    values
  );
  return mapPrayer(row);
}

export async function deletePrayer(userId, id) {
  const row = await queryOne(
    'delete from prayers where user_id = $1 and id = $2 returning id',
    [userId, id]
  );
  return Boolean(row);
}

// ------------------------------------------------------------- reading plans
export async function getReadingProgress(userId) {
  const { rows } = await query(
    'select plan_id, progress from reading_progress where user_id = $1',
    [userId]
  );
  return rows.map((row) => ({ id: row.plan_id, progress: row.progress }));
}

export async function setReadingProgress(userId, planId, progress) {
  const row = await queryOne(
    `insert into reading_progress (user_id, plan_id, progress)
     values ($1, $2, $3)
     on conflict (user_id, plan_id) do update set progress = excluded.progress
     returning plan_id, progress`,
    [userId, planId, progress]
  );
  return { id: row.plan_id, progress: row.progress };
}

// -------------------------------------------------------------- quiz results
export async function listQuizResults(userId) {
  const { rows } = await query('select * from quiz_results where user_id = $1', [userId]);
  return rows.map((row) => ({
    subjectKey: row.subject_key,
    bestScore: row.best_score,
    bestTotal: row.best_total,
    attempts: row.attempts,
    lastScore: row.last_score,
    lastTakenAt: row.last_taken_at.toISOString(),
  }));
}

export async function recordQuizResult(userId, subjectKey, score, total) {
  // Best is compared as a ratio so a longer quiz does not win automatically.
  const row = await queryOne(
    `insert into quiz_results (user_id, subject_key, best_score, best_total,
                               attempts, last_score, last_taken_at)
     values ($1, $2, $3, $4, 1, $3, now())
     on conflict (user_id, subject_key) do update set
       best_score = case
         when quiz_results.best_score::real / nullif(quiz_results.best_total, 0)
              >= excluded.best_score::real / nullif(excluded.best_total, 0)
         then quiz_results.best_score else excluded.best_score end,
       best_total = case
         when quiz_results.best_score::real / nullif(quiz_results.best_total, 0)
              >= excluded.best_score::real / nullif(excluded.best_total, 0)
         then quiz_results.best_total else excluded.best_total end,
       attempts      = quiz_results.attempts + 1,
       last_score    = excluded.last_score,
       last_taken_at = now()
     returning *`,
    [userId, subjectKey, score, total]
  );

  return {
    subjectKey: row.subject_key,
    bestScore: row.best_score,
    bestTotal: row.best_total,
    attempts: row.attempts,
    lastScore: row.last_score,
    lastTakenAt: row.last_taken_at.toISOString(),
  };
}
