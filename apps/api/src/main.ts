import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseReachable, databaseSettings } from './database.ts';
import { apiHostname, listen } from './server.ts';

const localEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (existsSync(localEnv)) {
  process.loadEnvFile(localEnv);
}

function databaseCheckEnabled(value: string | undefined): boolean {
  if (value === undefined || value === '' || value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  throw new Error('DB_STARTUP_CHECK must be true or false');
}

const port = Number(process.env.API_PORT ?? 8787);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write('API_PORT must be a port number\n');
  process.exit(1);
}

const hostname = apiHostname();
const checkDatabase = databaseCheckEnabled(process.env.DB_STARTUP_CHECK);
const database = checkDatabase ? databaseSettings() : undefined;
if (checkDatabase && database === undefined) {
  throw new Error('DB_STARTUP_CHECK requires complete database settings');
}
const server = await listen(port, hostname);
let stopping = false;
let shutdownTimer: NodeJS.Timeout | undefined;

function shutdown(signal: NodeJS.Signals): void {
  if (stopping) {
    return;
  }
  stopping = true;
  process.stdout.write(`API stopping (${signal})\n`);
  shutdownTimer = setTimeout(() => {
    process.stderr.write('API shutdown timed out\n');
    process.exit(1);
  }, 5000);
  shutdownTimer.unref();
  server.close();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
server.on('close', () => {
  if (shutdownTimer !== undefined) {
    clearTimeout(shutdownTimer);
  }
  process.removeListener('SIGINT', shutdown);
  process.removeListener('SIGTERM', shutdown);
  process.stdout.write('API stopped\n');
});
process.stdout.write(`API listening on ${hostname}:${port}\n`);

if (database !== undefined) {
  const connected = await databaseReachable(database);
  if (connected) {
    process.stdout.write('database connected\n');
  }
}
