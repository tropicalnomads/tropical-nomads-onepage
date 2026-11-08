import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { reviewPasswordSignIn, reviewProvider, reviewRegistration } from '../src/account/review.ts';
import { createSessionToken, readSessionSub } from '../src/account/session.ts';
import { shellCopy, type AccountNotice } from '../src/i18n/copy.ts';

const notices: AccountNotice[] = [
  'username-required',
  'username-invalid',
  'username-taken',
  'name-required',
  'email-invalid',
  'password-short',
  'password-long',
  'password-rejected',
  'cognito-not-configured',
  'provider-not-allowed',
  'not-signed-in',
  'avatar-rejected',
  'avatar-saved',
];

describe('accounts', () => {
  it('checks a registration before Cognito and does not accept a forged provider', () => {
    assert.equal(
      reviewRegistration(
        { email: 'ada@example.com', username: ' ', givenName: 'Ada', familyName: 'Lovelace', password: 'a-long-secret-phrase' },
        [],
        [],
      ),
      'username-required',
    );
    assert.equal(
      reviewRegistration(
        { email: 'ada@example.com', username: 'Ada', givenName: '', familyName: 'Lovelace', password: 'a-long-secret-phrase' },
        [],
        [],
      ),
      'name-required',
    );
    assert.equal(
      reviewRegistration(
        { email: 'ada@example.com', username: 'tropical-groove-2026-11-20', givenName: 'Ada', familyName: 'Lovelace', password: 'a-long-secret-phrase' },
        [],
        ['tropical-groove-2026-11-20'],
      ),
      'username-invalid',
    );
    assert.equal(
      reviewRegistration(
        { email: 'ada@example.com', username: 'Ada', givenName: 'Ada', familyName: 'Lovelace', password: 'a-long-secret-phrase' },
        ['ada'],
        [],
      ),
      'username-taken',
    );
    assert.equal(
      reviewRegistration(
        { email: 'ada@example.com', username: 'Ada', givenName: 'Ada', familyName: 'Lovelace', password: 'a-long-secret-phrase' },
        [],
        [],
      ),
      undefined,
    );
    assert.equal(reviewPasswordSignIn('ada@example.com', 'short'), 'password-short');
    assert.equal(reviewProvider('google'), 'cognito-not-configured');
    assert.equal(reviewProvider('apple'), 'cognito-not-configured');
    assert.equal(reviewProvider('password'), 'provider-not-allowed');
  });

  it('rejects a tampered session and keeps the registration screen free of shop controls', () => {
    const token = createSessionToken('sub-ada', Date.parse('2026-11-08T18:00:00.000Z'));
    assert.equal(readSessionSub(token, Date.parse('2026-11-08T18:00:00.000Z')), 'sub-ada');
    assert.equal(readSessionSub(`${token}x`, Date.parse('2026-11-08T18:00:00.000Z')), undefined);
    assert.equal(readSessionSub(token, Date.parse('2026-11-09T18:00:00.000Z')), undefined);
    const register = readFileSync(new URL('../app/account/register/page.tsx', import.meta.url), 'utf8');
    const form = readFileSync(new URL('../src/components/AccountForms.tsx', import.meta.url), 'utf8');
    const actions = readFileSync(new URL('../src/account/actions.ts', import.meta.url), 'utf8');
    assert.equal(register.includes('/merch'), false);
    assert.equal(register.includes('/check-in'), false);
    assert.equal(form.includes('cardNumber'), false);
    assert.equal(actions.includes('writeAccounts'), false);
    assert.equal(actions.includes('registerVerifiedAccount'), false);
    const onePager = readFileSync(new URL('../../one-pager/src/app/App.tsx', import.meta.url), 'utf8');
    assert.equal(onePager.includes('/account'), false);
    assert.deepEqual(Object.keys(shellCopy.en.account.notices).sort(), Object.keys(shellCopy.pt.account.notices).sort());
    for (const language of locales) {
      for (const notice of notices) {
        assert.notEqual(shellCopy[language].account.notices[notice].trim(), '');
      }
    }
  });
});