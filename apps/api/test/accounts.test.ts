import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { VerifiedSignIn } from 'tropical-nomads-shared';
import { api } from '../src/app.ts';
import {
  emptyAccounts,
  inspectAvatar,
  readAccounts,
  readAvatar,
  registerVerifiedAccount,
  saveAvatarFile,
  saveAvatarKey,
  saveDefaultBillingAddress,
  updateAccounts,
  writeAccounts,
} from '../src/accounts.ts';

const now = '2026-11-08T18:00:00.000Z';

function signIn(username: string, overrides: Partial<VerifiedSignIn> = {}): VerifiedSignIn {
  return {
    sub: `sub-${username}`,
    provider: 'cognito',
    providerSubject: `sub-${username}`,
    email: `${username}@example.com`,
    emailVerified: true,
    username,
    givenName: username,
    familyName: 'Nomad',
    ...overrides,
  };
}

describe('accounts', () => {
  it('keeps the committed profile file empty and off the public routes', async () => {
    const stored = readAccounts();
    assert.deepEqual(stored.profiles, []);
    assert.deepEqual(stored.billingAddresses, []);
    assert.deepEqual(stored.paymentMethods, []);
    assert.equal(JSON.stringify(stored).includes('password'), false);
    assert.equal((await api.request('/profiles')).status, 404);
    assert.equal((await api.request('/account', { method: 'POST' })).status, 405);
    const publicData = readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8');
    assert.equal(publicData.includes('"profiles"'), false);
  });

  it('stores one profile for two providers and refuses a password or a card number', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-accounts-'));
    writeAccounts(emptyAccounts(), root);
    await Promise.all([
      updateAccounts((current) => registerVerifiedAccount(current, signIn('ada'), [], now), root),
      updateAccounts((current) => registerVerifiedAccount(current, signIn('grace'), [], now), root),
    ]);
    const saved = readAccounts(root);
    assert.deepEqual(saved.profiles.map((profile) => profile.username).sort(), ['ada', 'grace']);
    const merged = registerVerifiedAccount(
      saved,
      signIn('ada', { sub: 'other-sub', provider: 'apple', providerSubject: 'apple-ada', email: 'ada@example.com' }),
      [],
      now,
    );
    assert.equal(merged.profiles.length, 2);
    assert.equal(merged.profiles.find((profile) => profile.username === 'ada')?.providers.length, 2);
    assert.throws(() => registerVerifiedAccount(saved, signIn('tropical-groove-2026-11-20'), ['tropical-groove-2026-11-20'], now));
    const withPassword = { ...saved, password: 'a-long-secret-phrase' };
    assert.throws(() => writeAccounts(withPassword as unknown as typeof saved, root));
    const withCard = {
      ...saved,
      paymentMethods: [{ id: 'pay-1', userId: 'sub-ada', note: '4111111111111111' }],
    };
    assert.throws(() => writeAccounts(withCard as unknown as typeof saved, root));
    assert.equal(readAccounts(root).profiles.length, 2);
    const billed = saveDefaultBillingAddress(
      saved,
      'sub-ada',
      { recipientName: 'Ada Nomad', line1: '1 Quay', city: 'Dublin', region: 'Leinster', postalCode: 'D01', country: 'IE' },
      now,
    );
    assert.equal(billed.profiles.find((profile) => profile.sub === 'sub-ada')?.billingAddressId, 'addr-sub-ada');
    assert.throws(() =>
      saveDefaultBillingAddress(saved, 'sub-ada', { recipientName: 'Ada', line1: '1 Quay', city: 'Dublin', region: 'Leinster', postalCode: 'D01' }, now),
    );
    const avatar = saveAvatarKey(saved, 'sub-ada', 'avatars/0123456789abcdef.jpg', now);
    assert.equal(avatar.profiles.find((profile) => profile.sub === 'sub-ada')?.avatarKey, 'avatars/0123456789abcdef.jpg');
    assert.throws(() => saveAvatarKey(saved, 'sub-ada', '../public/data/secret.jpg', now));
    const jpeg = new Uint8Array(32);
    jpeg[0] = 0xff;
    jpeg[1] = 0xd8;
    jpeg[2] = 0xff;
    assert.equal(inspectAvatar(jpeg), 'jpg');
    assert.equal(inspectAvatar(new Uint8Array([0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74])), undefined);
    const storedFile = saveAvatarFile(saved, 'sub-ada', jpeg, now, root);
    const key = storedFile.profiles.find((profile) => profile.sub === 'sub-ada')?.avatarKey ?? '';
    assert.match(key, /^avatars\/[a-f0-9]{32}\.jpg$/);
    assert.equal(existsSync(join(root, key)), true);
    assert.equal(readAvatar(key, root)?.length, jpeg.length);
    assert.equal(readAvatar('../public/secret.jpg', root), undefined);
    const disabled = {
      ...saved,
      profiles: saved.profiles.map((profile) => ({ ...profile, status: 'disabled' as const })),
    };
    assert.throws(() => saveAvatarFile(disabled, 'sub-ada', jpeg, now, root));
  });
});
