import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { connect } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import fkill from 'fkill';

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(repoRoot, '.env');
const nextLockPath = resolve(repoRoot, 'apps/web/.next/dev/lock');
const loopback = '127.0.0.1';
const webPort = 3100;

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function apiPortFromEnv() {
  const port = Number(process.env.API_PORT ?? 3101);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be a port number');
  }
  return port;
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EPERM') {
      return true;
    }
    return false;
  }
}

async function processCommand(pid) {
  try {
    if (process.platform === 'win32') {
      const command = `(Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}").CommandLine`;
      const result = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', command], {
        encoding: 'utf8',
      });
      return result.stdout.trim();
    }
    if (process.platform === 'linux') {
      return (await readFile(`/proc/${pid}/cmdline`, 'utf8')).replaceAll('\0', ' ').trim();
    }
    const result = await execFileAsync('ps', ['-p', String(pid), '-o', 'command='], {
      encoding: 'utf8',
    });
    return result.stdout.trim();
  } catch {
    return '';
  }
}

function isNextProcessForRepo(command) {
  const normalizedCommand = command.replaceAll('\\', '/').toLowerCase();
  const normalizedRoot = repoRoot.replaceAll('\\', '/').toLowerCase();
  return (
    normalizedCommand.includes(normalizedRoot) &&
    normalizedCommand.includes('next') &&
    (normalizedCommand.includes('start-server') || normalizedCommand.includes('next dev'))
  );
}

async function healthAt(origin) {
  try {
    const response = await fetch(`${origin}/health`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      return undefined;
    }
    const body = await response.json();
    return typeof body === 'object' && body !== null ? body : undefined;
  } catch {
    return undefined;
  }
}

function portIsOpen(port) {
  return new Promise((resolvePort) => {
    const socket = connect({ host: loopback, port });
    const finish = (open) => {
      socket.destroy();
      resolvePort(open);
    };
    socket.setTimeout(750);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForClosedPort(port) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (!(await portIsOpen(port))) {
      return;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Port ${port} did not close after stopping the previous service`);
}

async function stopProcess(pid, label) {
  process.stdout.write(`[dev] stopping existing ${label} (PID ${pid})\n`);
  try {
    await fkill(pid, {
      force: true,
      tree: true,
      waitForExit: 5000,
    });
  } catch (error) {
    if (processIsAlive(pid)) {
      throw error;
    }
  }
}

async function clearNextLock() {
  if (!existsSync(nextLockPath)) {
    return;
  }

  let lock;
  try {
    lock = JSON.parse(await readFile(nextLockPath, 'utf8'));
  } catch {
    throw new Error(`Next.js lock is invalid: ${nextLockPath}`);
  }

  const pid = Number(lock.pid);
  if (!Number.isInteger(pid) || pid < 1) {
    throw new Error(`Next.js lock has an invalid PID: ${nextLockPath}`);
  }

  if (!processIsAlive(pid)) {
    await rm(nextLockPath, { force: true });
    return;
  }

  const appUrl = typeof lock.appUrl === 'string' ? lock.appUrl : undefined;
  const health = appUrl === undefined ? undefined : await healthAt(appUrl);
  const command = await processCommand(pid);
  if (health?.service !== 'tropical-nomads-web' && !isNextProcessForRepo(command)) {
    throw new Error(
      `Next.js lock belongs to live PID ${pid}, but ${appUrl ?? 'its URL'} did not identify tropical-nomads-web`,
    );
  }

  await stopProcess(pid, `Tropical Nomads web server at ${appUrl}`);
  await rm(nextLockPath, { force: true });
}

async function clearServicePort(port, service, label) {
  if (!(await portIsOpen(port))) {
    return;
  }

  const origin = `http://${loopback}:${port}`;
  const health = await healthAt(origin);
  if (health?.service !== service) {
    throw new Error(`Port ${port} is occupied by a process that is not ${service}`);
  }

  process.stdout.write(`[dev] stopping existing ${label} at ${origin}\n`);
  try {
    await fkill(`:${port}`, {
      force: true,
      tree: true,
      waitForExit: 5000,
    });
  } catch (error) {
    if (await portIsOpen(port)) {
      throw error;
    }
  }
  await waitForClosedPort(port);
}

async function main() {
  const apiPort = apiPortFromEnv();
  await clearNextLock();
  await clearServicePort(webPort, 'tropical-nomads-web', 'web server');
  await clearServicePort(apiPort, 'tropical-nomads-api', 'API server');
  process.stdout.write(`[dev] ports ${webPort} and ${apiPort} are ready\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[dev] preflight failed: ${message}\n`);
  process.exitCode = 1;
});
