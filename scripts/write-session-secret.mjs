import { realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const target = join(dirname(fileURLToPath(import.meta.url)), '../apps/web/src/account/session-secret.ts');

export function sessionSecretModuleSource(secret) {
  const value = typeof secret === 'string' && secret.length >= 32 ? secret : '';
  return `// The Amplify build writes the server session secret here. Git keeps it empty.\nexport const builtSessionSecret = ${JSON.stringify(value)};\n`;
}

function writeSessionSecret() {
  const secret = process.env.ACCOUNT_SESSION_SECRET ?? '';
  writeFileSync(target, sessionSecretModuleSource(secret));
  console.log(secret.length >= 32 ? 'session secret written for the server build' : 'session secret left empty');
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  writeSessionSecret();
}
