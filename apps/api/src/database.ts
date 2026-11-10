import { existsSync, readFileSync } from 'node:fs';
import pg from 'pg';
import type { ConnectionOptions } from 'node:tls';

const { Client } = pg;
const rdsCaPath = '/etc/ssl/rds-global-bundle.pem';

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

type DatabaseSsl = 'require' | 'disable';

/** Unset and `true` require TLS. `false` is the local PostgreSQL on this machine. */
export function databaseSsl(env: Record<string, string | undefined> = process.env): DatabaseSsl {
  const value = env.DB_SSL?.trim() ?? '';
  if (value === '' || value === 'true') {
    return 'require';
  }
  if (value === 'false') {
    return 'disable';
  }
  throw new Error('DB_SSL must be true or false');
}

/** TLS server name stays the RDS hostname when a connection uses another host. */
export function databaseTls(env: Record<string, string | undefined> = process.env): ConnectionOptions | false {
  const mode = databaseSsl(env);
  switch (mode) {
    case 'disable':
      return false;
    case 'require': {
      const host = env.DB_HOST?.trim() ?? '';
      const servername = env.DB_TLS_SERVERNAME?.trim() || host;
      return {
        rejectUnauthorized: true,
        servername,
        ...(existsSync(rdsCaPath) ? { ca: readFileSync(rdsCaPath, 'utf8') } : {}),
      };
    }
    default: {
      const unreachable: never = mode;
      throw new Error(`DB_SSL must be true or false: ${String(unreachable)}`);
    }
  }
}

export function usingDatabase(root?: string, env: Record<string, string | undefined> = process.env): boolean {
  return root === undefined && databaseSettings(env) !== undefined;
}

export async function databaseReachable(settings: DatabaseSettings): Promise<boolean> {
  const client = new Client({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    ssl: databaseTls(),
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    await client.query('select 1');
    return true;
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : 'unknown';
    process.stdout.write(`database unavailable ${code}\n`);
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}
