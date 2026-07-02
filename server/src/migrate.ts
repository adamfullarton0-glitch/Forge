/**
 * Applies db/schema.sql to the configured database. Idempotent — run it on
 * every deploy (e.g. as a release/predeploy step). `npm run migrate`.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Pool } from 'pg';
import { loadConfig } from './config.js';

async function main(): Promise<void> {
  const config = loadConfig();
  if (!config.databaseUrl) throw new Error('DATABASE_URL is required to migrate.');

  const here = dirname(fileURLToPath(import.meta.url));
  const sql = await readFile(join(here, '..', 'db', 'schema.sql'), 'utf8');

  const pool = new Pool({ connectionString: config.databaseUrl });
  try {
    await pool.query(sql);
    // eslint-disable-next-line no-console
    console.log('✓ schema applied');
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
