import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accountCanPurchase,
  accountCanScan,
  attachVerifiedSignIn,
  passwordProblem,
  splitPersonName,
  usernameForSignIn,
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
    assert.equal(profile.displayName, 'Ada Lovelace');
    assert.equal(JSON.stringify(profile).includes('password'), false);
    assert.equal(attachVerifiedSignIn([], signIn({ givenName: '  ' }), now).ok, false);
    assert.equal(attachVerifiedSignIn([], signIn({ givenName: '4111111111111111' }), now).ok, false);
    assert.equal(passwordProblem('short', 'Ada', 'ada@example.com'), 'password is too short');
    assert.equal(passwordProblem('Long-secret-1', 'Long-secret-1', 'ada@example.com'), 'password is not allowed');
    assert.equal(passwordProblem('Long-secret-1', 'Ada', 'ada@example.com'), undefined);
    assert.equal(passwordProblem('long-secret-1', 'Ada', 'ada@example.com'), 'password needs an uppercase letter');
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

  it('splits a full name only when a given or family name is missing', () => {
    assert.deepEqual(splitPersonName({ givenName: 'Ada', familyName: 'Lovelace', fullName: 'Countess Ada' }), {
      givenName: 'Ada',
      familyName: 'Lovelace',
    });
    assert.deepEqual(splitPersonName({ givenName: '', familyName: '', fullName: 'Ada Lovelace' }), {
      givenName: 'Ada',
      familyName: 'Lovelace',
    });
    assert.deepEqual(splitPersonName({ givenName: 'Ada', familyName: '', fullName: 'Ada Lovelace' }), {
      givenName: 'Ada',
      familyName: 'Lovelace',
    });
    assert.deepEqual(splitPersonName({ givenName: '', familyName: '', fullName: 'Cher' }), {
      givenName: 'Cher',
      familyName: '',
    });
  });

  it('keeps a free username and generates one from the email when the request is empty or taken', () => {
    assert.equal(usernameForSignIn('Ada', 'ada@example.com', [], []), 'Ada');
    assert.equal(usernameForSignIn('', 'ada@example.com', [], []), 'ada');
    assert.equal(usernameForSignIn('Ada', 'ada@example.com', ['ada'], []), 'ada-1');
    assert.equal(usernameForSignIn('', 'julio+tag@gmail.com', [], []), 'juliotag');
    assert.notEqual(usernameForSignIn('', 'julio+tag@gmail.com', [], []), usernameForSignIn('', 'julio@gmail.com', [], []));
  });

  it('fills locale and display name on create, and leaves an existing profile alone', () => {
    const created = one(attachVerifiedSignIn([], signIn({ locale: 'pt-BR', displayName: 'Countess Ada' }), now));
    assert.equal(created.locale, 'pt');
    assert.equal(created.displayName, 'Countess Ada');
    const french = one(attachVerifiedSignIn([], signIn({ sub: 'sub-fr', providerSubject: 'sub-fr', email: 'fr@example.com', locale: 'fr' }), now));
    assert.equal(french.locale, undefined);
    const stored = {
      ...created,
      avatarKey: 'avatars/0123456789abcdef.jpg',
      locale: 'pt' as const,
      displayName: 'Countess',
    };
    const linked = attachVerifiedSignIn(
      [stored],
      signIn({
        sub: 'google-sub',
        provider: 'google',
        providerSubject: 'google-ada',
        email: 'ADA@example.com',
        givenName: 'Other',
        familyName: 'Person',
        displayName: 'Nope',
        locale: 'en',
        username: 'someone',
      }),
      '2026-11-08T19:00:00.000Z',
    );
    assert.equal(linked.ok, true);
    if (!linked.ok) {
      return;
    }
    assert.equal(linked.value.profile.sub, created.sub);
    assert.equal(linked.value.profile.givenName, 'Ada');
    assert.equal(linked.value.profile.familyName, 'Lovelace');
    assert.equal(linked.value.profile.displayName, 'Countess');
    assert.equal(linked.value.profile.locale, 'pt');
    assert.equal(linked.value.profile.avatarKey, 'avatars/0123456789abcdef.jpg');
    assert.equal(linked.value.profile.username, 'Ada');
  });

  it('refuses a disabled profile and a Google subject that belongs to someone else', () => {
    const profile = one(attachVerifiedSignIn([], signIn(), now));
    const disabled = attachVerifiedSignIn([{ ...profile, status: 'disabled' }], signIn({ provider: 'google', providerSubject: 'google-ada' }), now);
    assert.equal(disabled.ok, false);
    if (!disabled.ok) {
      assert.equal(disabled.errors[0], 'account is disabled');
    }
    const other = one(attachVerifiedSignIn([], signIn({ sub: 'sub-other', providerSubject: 'sub-other', email: 'other@example.com', username: 'Other' }), now));
    const conflict = attachVerifiedSignIn(
      [profile, { ...other, providers: [{ provider: 'google', subject: 'google-ada' }] }],
      signIn({ sub: 'google-cognito', provider: 'google', providerSubject: 'google-ada', email: 'ada@example.com' }),
      now,
    );
    assert.equal(conflict.ok, false);
  });

  it('updates a verified Google email only when no other profile has it', () => {
    const profile = one(attachVerifiedSignIn([], signIn({ provider: 'google', providerSubject: 'google-ada' }), now));
    const moved = attachVerifiedSignIn(
      [profile],
      signIn({ provider: 'google', providerSubject: 'google-ada', email: 'new@example.com', givenName: 'Changed', familyName: 'Name' }),
      '2026-11-08T19:00:00.000Z',
    );
    assert.equal(moved.ok, true);
    if (!moved.ok) {
      return;
    }
    assert.equal(moved.value.profile.email, 'new@example.com');
    assert.equal(moved.value.profile.givenName, 'Ada');
    const taken = one(attachVerifiedSignIn([], signIn({ sub: 'sub-taken', providerSubject: 'sub-taken', email: 'taken@example.com', username: 'Taken' }), now));
    const blocked = attachVerifiedSignIn(
      [profile, taken],
      signIn({ provider: 'google', providerSubject: 'google-ada', email: 'taken@example.com' }),
      now,
    );
    assert.equal(blocked.ok, false);
  });
});
