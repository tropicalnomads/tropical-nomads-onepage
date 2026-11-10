import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { euroTicketOffers, eventSaleChoice, isPayableAmount } from '../src/events/ticket-offer.ts';

describe('euro ticket offers', () => {
  it('keeps a euro offer and leaves every other party on the seller link', () => {
    assert.equal(isPayableAmount(12.5), true);
    assert.equal(isPayableAmount(0), false);
    assert.equal(isPayableAmount(12.555), false);
    const choice = eventSaleChoice(
      { eventbrite: 'https://www.eventbrite.com/e/example', goabase: 'https://www.goabase.net/party/1' },
      [
        { name: 'Door', amount: 20, currency: 'USD' },
        { name: 'Early', amount: 15, currency: 'EUR', capacity: 40 },
        { name: 'Open', amount: 18, currency: 'EUR' },
        { name: 'Blank', amount: 10 },
      ],
    );
    assert.deepEqual(choice.inAppOffers, [{ name: 'Early', amount: 15, currency: 'EUR', capacity: 40 }]);
    assert.equal(choice.ticketsOnSale, false);
    assert.equal(choice.ticketUrl, undefined);

    const external = eventSaleChoice(
      { eventbrite: 'https://www.eventbrite.com/e/example', goabase: 'https://www.goabase.net/party/1' },
      [{ name: 'Door', amount: 20, currency: 'USD' }],
    );
    assert.deepEqual(external.inAppOffers, []);
    assert.equal(external.ticketsOnSale, true);
    assert.equal(external.ticketUrl, 'https://www.eventbrite.com/e/example');
    assert.equal(euroTicketOffers([{ name: 'Free', amount: 0, currency: 'EUR' }]).length, 0);
  });
});
