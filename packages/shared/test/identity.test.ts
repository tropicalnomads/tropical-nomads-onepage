import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accountCanPurchase,
  accountCanScan,
  attachVerifiedSignIn,
  passwordProblem,
  usernameProblem,
  type VerifiedSignIn,
} from '../src/account/identity.ts';
import type { Profile } from '../src/schema/account.ts';

const now = '2026-11-08T18:00:00.000Z';

function signIn(overrides: Partial<VerifiedSignIn> = {}): VerifiedSignIn {
  return {
    sub: 'sub-ada',
    provider: 'cognito',
    providerSubject: 'sub-ada',
    email: 'Ada@Example.com',
    emailVerified: true,
    username: 'Ada',
    givenName: 'Ada',
    familyName: 'Lovelace',
    ...overrides,
  };
}

function one(result: ReturnType<typeof attachVerifiedSignIn>): Profile {
  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error('expected a profile');
  }
  assert.equal(result.value.profiles.length, 1);
  const profile = result.value.profiles[0];
  if (!profile) {
    throw new Error('missing profile');
  }
  return profile;
}

describe('account identity', () => {
  it('rejects a missing username, a taken username, and a public event id', () => {
    assert.equal(usernameProblem('  ', [], []), 'username is required');
    assert.equal(usernameProblem('ab', [], []), 'username is not valid');
    assert.equal(usernameProblem('Ada', ['ada'], []), 'username is taken');
    assert.equal(usernameProblem('tropical-groove-2026-11-20', [], ['tropical-groove-2026-11-20']), 'username is not valid');
    assert.equal(usernameProblem('Ada', [], []), undefined);
  });

  it('rejects a missing name, a card number, and a raw password field', () => {
    const created = attachVerifiedSignIn([], signIn(), now);
    const profile = one(created);
    assert.equal(profile.username, 'Ada');
    assert.equal(profile.email, 'ada@example.com');
    assert.equal(profile.role, 'user');
    assert.equal(profile.displayName, 'Ada');
    assert.equal(JSON.stringify(profile).includes('password'), false);
    assert.equal(attachVerifiedSignIn([], signIn({ givenName: '  ' }), now).ok, false);
    assert.equal(attachVerifiedSignIn([], signIn({ givenName: '4111111111111111' }), now).ok, false);
    assert.equal(passwordProblem('short', 'Ada', 'ada@example.com'), 'password is too short');
    assert.equal(passwordProblem('ada@example.com', 'Ada', 'Ada@Example.com'), 'password is not allowed');
    assert.equal(passwordProblem('a-long-secret-phrase', 'Ada', 'ada@example.com'), undefined);
  });

  it('merges a second verified provider onto the same profile', () => {
    const first = attachVerifiedSignIn([], signIn(), now);
    const profile = one(first);
    const second = attachVerifiedSignIn(
      first.ok ? first.value.profiles : [],
      signIn({
        sub: 'other-cognito-sub',
        provider: 'google',
        providerSubject: 'google-ada',
        email: 'ada@example.com',
        username: 'someone-else',
      }),
      '2026-11-08T19:00:00.000Z',
    );
    assert.equal(second.ok, true);
    if (!second.ok) {
      return;
    }
    assert.equal(second.value.profiles.length, 1);
    assert.equal(second.value.profile.sub, profile.sub);
    assert.equal(second.value.profile.username, 'Ada');
    assert.deepEqual(
      second.value.profile.providers.map((link) => link.provider),
      ['cognito', 'google'],
    );
    const unverified = attachVerifiedSignIn(second.value.profiles, signIn({ provider: 'apple', providerSubject: 'apple-ada', emailVerified: false }), now);
    assert.equal(unverified.ok, false);
    assert.equal(second.value.profiles.length, 1);
  });

  it('keeps a disabled profile from purchasing or scanning', () => {
    const profile = one(attachVerifiedSignIn([], signIn(), now));
    assert.equal(accountCanPurchase(profile), true);
    assert.equal(accountCanScan(profile), false);
    const disabled = { ...profile, status: 'disabled' as const };
    assert.equal(accountCanPurchase(disabled), false);
    assert.equal(accountCanScan(disabled), false);
    const door = { ...profile, role: 'door' as const };
    assert.equal(accountCanPurchase(door), false);
    assert.equal(accountCanScan(door), true);
    const admin = one(attachVerifiedSignIn([], signIn({ sub: 'owner-sub', providerSubject: 'owner-sub' }), now, { INITIAL_ADMIN_SUB: 'owner-sub' }));
    assert.equal(admin.role, 'admin');
    assert.equal(accountCanPurchase(admin), false);
    assert.equal(accountCanScan(admin), false);
  });
});
