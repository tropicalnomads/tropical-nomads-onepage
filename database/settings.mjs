import { existsSync, readFileSync } from 'node:fs';

export function databaseSettings(env = process.env) {
  const host = env.DB_HOST?.trim() ?? '';
  const user = env.DB_USER?.trim() ?? '';
  const password = env.DB_PASSWORD ?? '';
  const database = env.DB_NAME?.trim() || 'postgres';
  const port = Number(env.DB_PORT ?? '5432');
  if (host === '' || user === '' || password === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    return undefined;
  }
  const servername = env.DB_TLS_SERVERNAME?.trim() || host;
  return { host, port, user, password, database, servername };
}

export function sslConfig(servername) {
  const caPath = '/etc/ssl/rds-global-bundle.pem';
  return {
    rejectUnauthorized: true,
    servername,
    ...(existsSync(caPath) ? { ca: readFileSync(caPath, 'utf8') } : {}),
  };
}
