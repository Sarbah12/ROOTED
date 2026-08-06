/**
 * Applies backend/schema.sql to the database in DATABASE_URL.
 *
 *   npm run migrate --prefix backend
 *
 * The schema is idempotent, so running this repeatedly is safe — it is how you
 * apply changes after editing schema.sql.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { closePool, getPool } from './db.mjs';
import { config } from './config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!config.databaseUrl) {
    console.error('DATABASE_URL is not set. Add it to .env before running migrations.');
    process.exit(1);
  }

  // Never print the URL itself; it contains the password.
  const host = (() => {
    try {
      return new URL(config.databaseUrl).host;
    } catch {
      return '(unparseable)';
    }
  })();

  console.log(`Applying schema to ${host} …`);

  const sql = await readFile(path.join(here, 'schema.sql'), 'utf8');
  const client = await getPool().connect();

  try {
    await client.query(sql);
    console.log('Schema applied.');

    const { rows } = await client.query(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`
    );
    console.log('Tables:', rows.map((r) => r.table_name).join(', '));
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
