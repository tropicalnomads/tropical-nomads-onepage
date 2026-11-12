import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseOrder, type VerifiedSignIn } from 'tropical-nomads-shared';
import {
  anonymizeDoorInvites,
  commitAccountErasure,
  erasePersonalData,
  stripOrderDelivery,
} from '../src/account-erasure.ts';
import { emptyAccounts, readAccounts, registerVerifiedAccount, saveAvatarFile, saveDefaultBillingAddress, saveProfileDetails, writeAccounts } from '../src/accounts.ts';
import { deleteCognitoAccount, type CognitoUserDirectory } from '../src/cognito-admin.ts';
import { readOperational, writeOperational } from '../src/operational.ts';

const now = '2026-11-12T12:00:00.000Z';
const pool = { COGNITO_USER_POOL_ID: 'eu-central-1_testpool' };

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

function sampleFile() {
  let file = emptyAccounts();
  file = registerVerifiedAccount(
    file,
    signIn('ada', { provider: 'google', providerSubject: 'google-ada', givenName: 'Julio', familyName: 'Lp' }),
    [],
    now,
  );
  file = registerVerifiedAccount(file, signIn('grace', { givenName: 'Grace', familyName: 'Hopper' }), [], now);
  file = saveProfileDetails(
    file,
    'sub-ada',
    {
      givenName: 'Julio',
      familyName: 'Lp',
      displayName: 'Julio Lp',
      phone: '+353871234567',
      city: 'Dublin',
      region: 'Leinster',
      postalCode: 'D01',
      country: 'Ireland',
    },
    now,
  );
  file = saveDefaultBillingAddress(
    file,
    'sub-ada',
    { recipientName: 'Julio Lp', line1: '1 Quay', city: 'Dublin', region: 'Leinster', postalCode: 'D01', country: 'IE' },
    now,
  );
  file = saveDefaultBillingAddress(
    file,
    'sub-grace',
    { recipientName: 'Grace Hopper', line1: '2 Quay', city: 'Lisbon', region: 'Lisboa', postalCode: '1100', country: 'PT' },
    now,
  );
  return {
    ...file,
    profiles: file.profiles.map((profile) => (profile.sub === 'sub-ada' ? { ...profile, role: 'admin' as const } : profile)),
    paymentMethods: [
      {
        id: 'pm-ada',
        userId: 'sub-ada',
        type: 'card' as const,
        providerCustomerReference: 'cus_ada',
        providerMethodReference: 'pm_ada',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2028,
        billingAddressId: 'addr-sub-ada',
        status: 'active',
      },
      {
        id: 'pm-grace',
        userId: 'sub-grace',
        type: 'card' as const,
        providerCustomerReference: 'cus_grace',
        providerMethodReference: 'pm_grace',
        brand: 'visa',
        last4: '1111',
        expiryMonth: 1,
        expiryYear: 2029,
        billingAddressId: 'addr-sub-grace',
        status: 'active',
      },
    ],
  };
}

const adaOrder = {
  id: 'ord-ada',
  userId: 'sub-ada',
  purpose: 'tickets',
  lines: [{ kind: 'ticket', partyId: 'party-1', offerName: 'Full pass', quantity: 2 }],
  traceId: 'trace-ada',
  createdAt: now,
  delivery: { name: 'Julio Lp', line1: '1 Quay', city: 'Dublin', region: 'Leinster', postalCode: 'D01', country: 'IE' },
};

const graceOrder = {
  id: 'ord-grace',
  userId: 'sub-grace',
  purpose: 'shop',
  lines: [{ kind: 'shop', productId: 'shirt', size: 'M', quantity: 1 }],
  traceId: 'trace-grace',
  createdAt: now,
  delivery: { name: 'Grace Hopper', line1: '2 Quay', city: 'Lisbon', postalCode: '1100', country: 'PT' },
};

function prepare(root: string): string {
  const jpeg = new Uint8Array(32);
  jpeg[0] = 0xff;
  jpeg[1] = 0xd8;
  jpeg[2] = 0xff;
  const stored = saveAvatarFile(sampleFile(), 'sub-ada', jpeg, now, root);
  writeAccounts(stored, root);
  writeOperational('orders', { schemaVersion: 1, records: [adaOrder, graceOrder] }, root);
  writeOperational(
    'door-invites',
    {
      schemaVersion: 1,
      records: [
        { id: 'inv-ada', email: 'ada@example.com', userId: 'sub-ada', partyIds: ['party-1'], revoked: false },
        { id: 'inv-mail', email: 'ADA@example.com', partyIds: ['party-1'], revoked: false },
        { id: 'inv-grace', email: 'grace@example.com', partyIds: ['party-1'], revoked: false },
      ],
    },
    root,
  );
  writeFileSync(join(root, 'payment-traces.json'), `${JSON.stringify({ schemaVersion: 1, records: [{ id: 'trace-ada', userId: 'sub-ada' }] }, null, 2)}\n`);
  writeFileSync(join(root, 'issued-tickets.json'), `${JSON.stringify({ schemaVersion: 1, records: [{ id: 'ticket-ada', buyerId: 'sub-ada' }] }, null, 2)}\n`);
  return stored.profiles.find((profile) => profile.sub === 'sub-ada')?.avatarKey ?? '';
}

function quietDirectory(username?: string): CognitoUserDirectory & { deleted: string[] } {
  const deleted: string[] = [];
  return {
    deleted,
    async findUsername() {
      return username;
    },
    async deleteUsername(_poolId, found) {
      deleted.push(found);
    },
  };
}

describe('account erasure', () => {
  it('removes personal data and keeps the profile id for product records', () => {
    const file = sampleFile();
    const erased = erasePersonalData(file, 'sub-ada', now, []);
    const profile = erased.file.profiles.find((item) => item.sub === 'sub-ada');
    const grace = erased.file.profiles.find((item) => item.sub === 'sub-grace');
    assert.equal(profile?.sub, 'sub-ada');
    assert.equal(profile?.status, 'disabled');
    assert.equal(profile?.role, 'user');
    assert.equal(profile?.emailVerified, false);
    assert.equal(profile?.givenName, 'Deleted');
    assert.equal(profile?.familyName, 'Account');
    assert.equal(profile?.email.includes('@deleted.invalid'), true);
    assert.notEqual(profile?.email, 'ada@example.com');
    assert.equal(profile?.phone, undefined);
    assert.equal(profile?.displayName, undefined);
    assert.equal(profile?.city, undefined);
    assert.equal(profile?.billingAddressId, undefined);
    assert.deepEqual(profile?.providers, [{ provider: 'cognito', subject: 'sub-ada' }]);
    assert.equal(JSON.stringify(profile).includes('Julio'), false);
    assert.equal(JSON.stringify(profile).includes('google-ada'), false);
    assert.equal(JSON.stringify(profile).includes('+353871234567'), false);
    assert.equal(grace?.email, 'grace@example.com');
    assert.equal(grace?.familyName, 'Hopper');
    assert.deepEqual(erased.file.paymentMethods.map((method) => method.id), ['pm-grace']);
    assert.deepEqual(erased.file.billingAddresses.map((address) => address.id), ['addr-sub-grace']);
    assert.equal(JSON.stringify(erased.file).includes('4242'), false);
    assert.equal(JSON.stringify(erased.file).includes('cus_ada'), false);
    const again = erasePersonalData(erased.file, 'sub-ada', '2026-11-13T00:00:00.000Z', []);
    assert.equal(again.email, erased.email);
    assert.equal(again.file.profiles.find((item) => item.sub === 'sub-ada')?.username, profile?.username);
    const renamed = erasePersonalData(file, 'sub-ada', now, ['dsubada']);
    assert.notEqual(renamed.file.profiles.find((item) => item.sub === 'sub-ada')?.username, 'dsubada');
    const returned = registerVerifiedAccount(
      erased.file,
      signIn('ada', { sub: 'sub-ada-2', provider: 'google', providerSubject: 'google-ada' }),
      [],
      now,
    );
    assert.equal(returned.profiles.length, 3);
    assert.equal(returned.profiles.find((item) => item.sub === 'sub-ada-2')?.email, 'ada@example.com');
    assert.equal(returned.profiles.find((item) => item.sub === 'sub-ada')?.status, 'disabled');
    const orders = stripOrderDelivery([adaOrder, graceOrder], 'sub-ada');
    const ada = parseOrder(orders[0]);
    const kept = parseOrder(orders[1]);
    assert.equal(ada.ok, true);
    assert.equal(kept.ok, true);
    if (ada.ok && kept.ok) {
      assert.equal(ada.value.userId, 'sub-ada');
      assert.equal(ada.value.delivery, undefined);
      assert.equal(ada.value.lines[0]?.kind, 'ticket');
      assert.equal(kept.value.delivery?.name, 'Grace Hopper');
    }
    const invites = anonymizeDoorInvites(
      [
        { id: 'inv-ada', email: 'ada@example.com', userId: 'sub-ada' },
        { id: 'inv-mail', email: 'ADA@example.com' },
        { id: 'inv-grace', email: 'grace@example.com' },
      ],
      'sub-ada',
      'ada@example.com',
      erased.email,
    );
    assert.equal((invites[0] as { email: string }).email, erased.email);
    assert.equal((invites[1] as { email: string }).email, erased.email);
    assert.equal((invites[2] as { email: string }).email, 'grace@example.com');
    assert.throws(() => erasePersonalData(file, 'missing', now, []));
  });

  it('keeps orders, tickets, and traces while removing the person and the Google user', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-erase-'));
    const traces = join(root, 'payment-traces.json');
    const tickets = join(root, 'issued-tickets.json');
    const avatarKey = prepare(root);
    const directory = quietDirectory('google_1109');
    await commitAccountErasure('sub-ada', now, { root, env: pool, directory });
    const saved = readAccounts(root);
    const profile = saved.profiles.find((item) => item.sub === 'sub-ada');
    const orders = readOperational('orders', root).records;
    const invites = readOperational('door-invites', root).records;
    assert.deepEqual(directory.deleted, ['google_1109']);
    assert.equal(profile?.email.endsWith('@deleted.invalid'), true);
    assert.equal(profile?.avatarKey, undefined);
    assert.equal(existsSync(join(root, avatarKey)), false);
    assert.equal(JSON.stringify(orders[0]).includes('Julio'), false);
    assert.equal(JSON.stringify(orders[0]).includes('delivery'), false);
    assert.equal(JSON.stringify(orders[0]).includes('Full pass'), true);
    assert.equal(JSON.stringify(orders[1]).includes('Grace Hopper'), true);
    assert.equal((invites[0] as { email: string }).email, profile?.email);
    assert.equal((invites[1] as { email: string }).email, profile?.email);
    assert.equal((invites[2] as { email: string }).email, 'grace@example.com');
    assert.equal(readFileSync(traces, 'utf8').includes('sub-ada'), true);
    assert.equal(readFileSync(tickets, 'utf8').includes('ticket-ada'), true);
    const traceBefore = readFileSync(traces, 'utf8');
    const ticketBefore = readFileSync(tickets, 'utf8');
    await commitAccountErasure('sub-ada', '2026-11-13T00:00:00.000Z', { root, env: pool, directory: quietDirectory() });
    assert.equal(readAccounts(root).profiles.find((item) => item.sub === 'sub-ada')?.email, profile?.email);
    assert.equal(readFileSync(traces, 'utf8'), traceBefore);
    assert.equal(readFileSync(tickets, 'utf8'), ticketBefore);
  });

  it('leaves personal data in place when Cognito refuses the delete', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-erase-'));
    prepare(root);
    const directory: CognitoUserDirectory = {
      async findUsername() {
        throw new Error('AccessDenied');
      },
      async deleteUsername() {
        throw new Error('should not delete');
      },
    };
    await assert.rejects(() => commitAccountErasure('sub-ada', now, { root, env: pool, directory }));
    const saved = readAccounts(root);
    assert.equal(saved.profiles.find((profile) => profile.sub === 'sub-ada')?.email, 'ada@example.com');
    assert.equal(JSON.stringify(readOperational('orders', root).records[0]).includes('Julio'), true);
    assert.equal(saved.paymentMethods.some((method) => method.userId === 'sub-ada'), true);
  });

  it('treats a missing Cognito user as already deleted and still removes personal data', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-erase-'));
    prepare(root);
    await commitAccountErasure('sub-ada', now, { root, env: pool, directory: quietDirectory() });
    assert.equal(readAccounts(root).profiles.find((profile) => profile.sub === 'sub-ada')?.email.endsWith('@deleted.invalid'), true);
    const missing = Object.assign(new Error('gone'), { name: 'UserNotFoundException' });
    const rootAgain = mkdtempSync(join(tmpdir(), 'tn-erase-'));
    prepare(rootAgain);
    await commitAccountErasure('sub-ada', now, {
      root: rootAgain,
      env: pool,
      directory: {
        async findUsername() {
          return 'google_1109';
        },
        async deleteUsername() {
          throw missing;
        },
      },
    });
    assert.equal(readAccounts(rootAgain).profiles.find((profile) => profile.sub === 'sub-ada')?.phone, undefined);
  });

  it('does not call Cognito when the pool is not configured or the subject is not a user id', async () => {
    let calls = 0;
    const directory: CognitoUserDirectory = {
      async findUsername() {
        calls += 1;
        return 'google_1109';
      },
      async deleteUsername() {
        calls += 1;
      },
    };
    await deleteCognitoAccount('sub-ada', {}, directory);
    assert.equal(calls, 0);
    await assert.rejects(() => deleteCognitoAccount('bad subject', pool, directory));
    assert.equal(calls, 0);
    const root = mkdtempSync(join(tmpdir(), 'tn-erase-'));
    writeAccounts(sampleFile(), root);
    await assert.rejects(() => commitAccountErasure('sub-missing', now, { root, env: pool, directory }));
    assert.equal(calls, 0);
    assert.equal(readAccounts(root).profiles.find((profile) => profile.sub === 'sub-ada')?.email, 'ada@example.com');
  });
});
