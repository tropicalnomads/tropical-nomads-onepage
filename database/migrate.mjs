import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import { databaseSettings, sslConfig } from './settings.mjs';

const { Client } = pg;

export async function migrate(env = process.env) {
  const settings = databaseSettings(env);
  if (!settings) {
    throw new Error('database settings are incomplete');
  }
  const client = new Client({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    ssl: sslConfig(settings.servername),
  });
  await client.connect();
  try {
    await client.query(`create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )`);
    const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
    const files = readdirSync(directory)
      .filter((name) => name.endsWith('.sql'))
      .sort();
    for (const filename of files) {
      const existing = await client.query('select 1 from schema_migrations where filename = $1', [filename]);
      if (existing.rowCount !== 0) {
        continue;
      }
      const sql = readFileSync(join(directory, filename), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (filename) values ($1)', [filename]);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrate().catch((error) => {
    const message = error instanceof Error ? error.message : 'migration failed';
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
