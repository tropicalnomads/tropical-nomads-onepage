import pg from 'pg';

const { Client } = pg;

export interface DatabaseSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/** Settings come from the task environment. The password is the Secrets Manager value, never a file. */
export function databaseSettings(env: Record<string, string | undefined> = process.env): DatabaseSettings | undefined {
  const host = env.DB_HOST?.trim() ?? '';
  const user = env.DB_USER?.trim() ?? '';
  const password = env.DB_PASSWORD ?? '';
  const database = env.DB_NAME?.trim() || 'postgres';
  const port = Number(env.DB_PORT ?? '5432');
  if (host === '' || user === '' || password === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    return undefined;
  }
  return { host, port, user, password, database };
}

export async function databaseReachable(settings: DatabaseSettings): Promise<boolean> {
  const client = new Client({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 4000,
  });
  try {
    await client.connect();
    await client.query('select 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}
