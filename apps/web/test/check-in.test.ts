import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { checkInText, shellCopy } from '../src/i18n/copy.ts';

describe('check-in page', () => {
  it('keeps the scanner off the buyer copy and off the one-pager', () => {
    const page = readFileSync(new URL('../app/check-in/page.tsx', import.meta.url), 'utf8');
    const actions = readFileSync(new URL('../src/check-in/actions.ts', import.meta.url), 'utf8');
    const onePager = readFileSync(new URL('../../one-pager/src/components/UpcomingEventsList.tsx', import.meta.url), 'utf8');
    assert.equal(page.includes('secret'), false);
    assert.equal(actions.includes('markPaymentConfirmed'), false);
    assert.equal(actions.includes('recordRefund'), false);
    assert.equal(actions.includes('commitScan'), true);
    assert.equal(onePager.includes('QrCamera'), false);
    assert.equal(onePager.includes('checkInTicketAction'), false);
    for (const language of locales) {
      assert.equal(checkInText(language, 'alreadyUsed').trim().length > 0, true);
      assert.equal(checkInText(language, 'deniedBody').includes('http'), false);
      assert.equal(Object.keys(shellCopy.en.checkIn).sort().join(), Object.keys(shellCopy[language].checkIn).sort().join());
    }
  });
});
