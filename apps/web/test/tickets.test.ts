import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { eventSaleChoice, locales, qrPayloadText } from 'tropical-nomads-shared';
import { shellCopy, ticketText } from '../src/i18n/copy.ts';
import { ticketQrSvg } from '../src/tickets/qr.ts';

describe('ticket purchase', () => {
  it('encodes the QR from the shared payload and keeps an unswitched card on the seller url', async () => {
    const text = qrPayloadText({ id: 'ticket-1', secret: 'not-the-party' });
    assert.equal(text.ok, true);
    if (!text.ok) {
      return;
    }
    assert.equal(text.value, '{"id":"ticket-1","secret":"not-the-party"}');
    assert.equal(qrPayloadText({ partyId: 'party-9' }).ok, false);
    const svg = await ticketQrSvg({ id: 'ticket-1', secret: 'not-the-party' });
    assert.match(svg, /^<svg/);
    assert.equal(svg.includes('not-the-party'), false);
    assert.equal(svg.includes('party-9'), false);
    assert.match(svg, /width="280"/);
    const external = eventSaleChoice({ tickets: 'https://www.example.com/tickets', goabase: 'https://www.goabase.net/party/1' }, []);
    assert.equal(external.inAppOffers.length, 0);
    assert.equal(external.ticketUrl, 'https://www.example.com/tickets');
    const actions = readFileSync(new URL('../src/tickets/actions.ts', import.meta.url), 'utf8');
    const page = readFileSync(new URL('../app/my-tickets/page.tsx', import.meta.url), 'utf8');
    assert.equal(actions.includes('markPaymentConfirmed'), false);
    assert.equal(actions.includes('recordRefund'), false);
    assert.equal(actions.includes("'currency'"), true);
    assert.equal(actions.includes('commitTicket'), true);
    assert.equal(page.includes('searchParams'), true);
    assert.equal(page.includes('secret'), false);
    for (const language of locales) {
      assert.equal(ticketText(language, 'notValid').trim().length > 0, true);
      assert.equal(ticketText(language, 'unpaid').includes('http'), false);
      assert.equal(Object.keys(shellCopy.en.tickets).sort().join(), Object.keys(shellCopy[language].tickets).sort().join());
    }
  });
});
