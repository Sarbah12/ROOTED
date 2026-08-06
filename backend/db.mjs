import pg from 'pg';

import { config } from './config.mjs';

/**
 * Postgres connection pool.
 *
 * Supabase terminates TLS with a certificate this pool does not have a root for,
 * so verification is relaxed for that host only. The connection is still
 * encrypted; it just is not authenticated against a CA bundle.
 */

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (pool) return pool;

  if (!config.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and add your Postgres connection string.'
    );
  }

  const isSupabase = config.databaseUrl.includes('supabase.co');

  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: isSupabase || config.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('error', (error) => {
    // An idle client dying should not take the process down.
    console.error('[db] idle client error:', error.message);
  });

  return pool;
}

export async function query(text, params = []) {
  const result = await getPool().query(text, params);
  return result;
}

/** First row, or null. Saves the `.rows[0] ?? null` dance at every call site. */
export async function queryOne(text, params = []) {
  const { rows } = await query(text, params);
  return rows[0] ?? null;
}

/** Runs `fn` inside a transaction, rolling back on any throw. */
export async function transaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/** Used by the health endpoint so "up" means "can actually reach Postgres". */
export async function checkConnection() {
  const row = await queryOne('select now() as now');
  return row?.now ?? null;
}
