import { createHmac, timingSafeEqual } from 'node:crypto';

const cookieName = 'tn:account:v1';

function sessionSecret(): string | undefined {
  const configured = process.env.ACCOUNT_SESSION_SECRET;
  if (configured && configured.length >= 32) {
    return configured;
  }
  return undefined;
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

function signedBody(token: string | undefined, secret: string): string | undefined {
  if (!token) {
    return undefined;
  }
  const [body, mac] = token.split('.');
  if (!body || !mac) {
    return undefined;
  }
  const expected = sign(body, secret);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return undefined;
  }
  return body;
}

export function readSessionSub(token: string | undefined, now = Date.now()): string | undefined {
  const secret = sessionSecret();
  if (!secret) {
    return undefined;
  }
  const body = signedBody(token, secret);
  if (!body) {
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

export function openSealed(token: string | undefined, now = Date.now()): unknown {
  const secret = sessionSecret();
  if (!secret) {
    return undefined;
  }
  const body = signedBody(token, secret);
  if (!body) {
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

export function sessionFromCookie(header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const prefix = `${cookieName}=`;
    if (trimmed.startsWith(prefix)) {
      return readSessionSub(decodeURIComponent(trimmed.slice(prefix.length)));
    }
  }
  return undefined;
}
