/**
 * Production entry point: wires the Postgres-backed repositories into the app
 * and starts listening. (Tests build the app directly with in-memory repos.)
 */
import { Pool } from 'pg';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { pgRepos } from './repo/pg.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });
  const { users, state } = pgRepos(pool);
  const app = buildApp({ config, users, state });

  const shutdown = (): void => {
    void app.close().then(() => pool.end());
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await app.listen({ port: config.port, host: '0.0.0.0' });
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
