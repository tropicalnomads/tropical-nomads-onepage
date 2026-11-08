import { readAccounts, readAvatar } from 'tropical-nomads-api/accounts';
import { currentAccountSub } from '../../../src/account/actions';

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
  const profile = sub ? readAccounts().profiles.find((item) => item.sub === sub && item.status === 'active') : undefined;
  const key = profile?.avatarKey;
  const bytes = key ? readAvatar(key) : undefined;
  if (!bytes) {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': types[avatarType(key)],
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}
