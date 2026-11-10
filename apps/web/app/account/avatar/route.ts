import { loadAvatar } from 'tropical-nomads-api/accounts';
import { currentAccountSub } from '../../../src/account/actions';
import { apiOrigin } from '../../../src/api-origin';
import { callPrivate, currentAccounts } from '../../../src/remote-store';
import { withNoindex } from '../../../src/seo/headers.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const types = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

function avatarType(key: string | undefined): keyof typeof types {
  if (key?.endsWith('.png')) {
    return 'png';
  }
  if (key?.endsWith('.webp')) {
    return 'webp';
  }
  return 'jpg';
}

export async function GET(): Promise<Response> {
  const sub = await currentAccountSub();
  if (apiOrigin()) {
    const stored = await callPrivate<{ bytes: string | null; key: string | null }>('avatar');
    if (!stored.bytes) {
      return withNoindex(new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } }));
    }
    return withNoindex(new Response(Buffer.from(stored.bytes, 'base64'), {
      status: 200,
      headers: {
        'content-type': types[avatarType(stored.key ?? undefined)],
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      },
    }));
  }
  const profile = sub ? (await currentAccounts()).profiles.find((item) => item.sub === sub && item.status === 'active') : undefined;
  const key = profile?.avatarKey;
  const bytes = key ? await loadAvatar(key) : undefined;
  if (!bytes) {
    return withNoindex(new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } }));
  }
  return withNoindex(new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': types[avatarType(key)],
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    },
  }));
}
