import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { builtSessionSecret } from './session-secret.ts';

export const sessionCookieName = 'tn:account:v1';

const lifetimeSeconds = 60 * 60 * 12;

let processSecret: string | undefined;

export function configuredSessionSecret(envValue: string | undefined, built = builtSessionSecret): string | undefined {
  if (envValue && envValue.length >= 32) {
    return envValue;
  }
  if (built.length >= 32) {
    return built;
  }
  return undefined;
}

export function sessionSecretConfigured(
  env: Record<string, string | undefined> = process.env,
  built = builtSessionSecret,
): boolean {
  return configuredSessionSecret(env.ACCOUNT_SESSION_SECRET, built) !== undefined;
}

function sessionSecret(): string {
  const configured = configuredSessionSecret(process.env.ACCOUNT_SESSION_SECRET);
  if (configured) {
    return configured;
  }
  if (!processSecret) {
    processSecret = randomBytes(32).toString('hex');
  }
  return processSecret;
}

function sign(body: string): string {
  return createHmac('sha256', sessionSecret()).update(body).digest('base64url');
}

export const sessionCookieMaxAge = lifetimeSeconds;

export function createSessionToken(sub: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ sub, exp: Math.floor(now / 1000) + lifetimeSeconds }), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
}

export function sealPayload(payload: unknown, ttlSeconds: number, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ v: payload, exp: Math.floor(now / 1000) + ttlSeconds }), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
}

export function openPayload(token: string | undefined, now = Date.now()): unknown {
  if (!token) {
    return undefined;
  }
  const [body, mac] = token.split('.');
  if (!body || !mac) {
    return undefined;
  }
  const expected = sign(body);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }
    const record = parsed as { v?: unknown; exp?: unknown };
    if (typeof record.exp !== 'number' || record.exp * 1000 <= now) {
      return undefined;
    }
    return record.v;
  } catch {
    return undefined;
  }
}

export function readSessionSub(token: string | undefined, now = Date.now()): string | undefined {
  if (!token) {
    return undefined;
  }
  const [body, mac] = token.split('.');
  if (!body || !mac) {
    return undefined;
  }
  const expected = sign(body);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }
    const record = parsed as { sub?: unknown; exp?: unknown };
    if (typeof record.sub !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(record.sub)) {
      return undefined;
    }
    if (typeof record.exp !== 'number' || record.exp * 1000 <= now) {
      return undefined;
    }
    return record.sub;
  } catch {
    return undefined;
  }
}
