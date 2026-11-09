import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseReachable, databaseSettings } from './database.ts';
import { apiHostname, listen } from './server.ts';

const localEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (existsSync(localEnv)) {
  process.loadEnvFile(localEnv);
}

const port = Number(process.env.API_PORT ?? 8787);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write('API_PORT must be a port number\n');
  process.exit(1);
}

const hostname = apiHostname();
const server = await listen(port, hostname);
server.on('close', () => {
  process.stdout.write('API stopped\n');
});
process.stdout.write(`API listening on ${hostname}:${port}\n`);

const database = databaseSettings();
if (database) {
  const connected = await databaseReachable(database);
  if (connected) {
    process.stdout.write('database connected\n');
  }
}
