import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const sessionCookieName = 'tn:account:v1';

const lifetimeSeconds = 60 * 60 * 12;

let processSecret: string | undefined;

function sessionSecret(): string {
  const configured = process.env.ACCOUNT_SESSION_SECRET;
  if (configured && configured.length >= 32) {
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

export function createSessionToken(sub: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ sub, exp: Math.floor(now / 1000) + lifetimeSeconds }), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
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
