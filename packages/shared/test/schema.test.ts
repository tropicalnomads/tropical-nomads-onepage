import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  declareLookup,
  lookups,
  parseArtistOffer,
  parseBillingAddress,
  parseCalendarEntry,
  parseConsents,
  parseEmailTemplate,
  parseParty,
  parsePaymentMethod,
  parsePaymentTrace,
  parseProfile,
  parseProfiles,
  parseQrPayload,
  parseStockCounts,
  publishedSchemas,
  schemas,
  ticketSecretMatches,
} from '../src/index.ts';

const party = {
  id: 'party-1',
  title: 'Tropical Groove',
  dateStart: '2026-12-01',
  venue: { id: 'venue-1', city: 'Lisbon', country: 'Portugal', isoCountry: 'PT' },
  links: { goabase: 'https://www.goabase.net/party/party-1' },
};

const address = {
  id: 'addr-1',
  recipientName: 'Ada Lovelace',
  line1: '1 Rua',
  city: 'Lisbon',
  region: 'Lisbon',
  postalCode: '1000-001',
  country: 'PT',
};

function profile(username: string, overrides: Record<string, unknown> = {}) {
  return {
    sub: `sub-${username}`,
    email: `${username}@example.com`,
    emailVerified: true,
    username,
    givenName: 'Ada',
    familyName: 'Lovelace',
    providers: [{ provider: 'cognito', subject: `sub-${username}` }],
    createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z',
    status: 'active',
    role: 'user',
    ...overrides,
  };
}

const paymentMethod = {
  id: 'pm-1',
  userId: 'user-1',
  type: 'card',
  providerCustomerReference: 'cus_1',
  providerMethodReference: 'pm_1',
  brand: 'visa',
  last4: '4242',
  expiryMonth: 12,
  expiryYear: 2028,
  billingAddressId: 'addr-1',
  status: 'active',
};

function template(id: string, marketing: boolean) {
  return {
    id,
    purpose: id,
    marketing,
    subject: { en: 'Subject', pt: 'Assunto' },
    body: { en: 'Body', pt: 'Corpo' },
  };
}

function omit(value: object, key: string): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...value };
  delete copy[key];
  return copy;
}

function consent(id: string, subjectId: string, stopToken: string) {
  return {
    id,
    subjectKind: 'account',
    subjectId,
    purpose: 'new-party',
    consentedAt: '2026-11-08T00:00:00Z',
    stopToken,
  };
}

describe('schemas', () => {
  it('names every record and keeps secrets off the published field lists', () => {
    const names = [
      'party',
      'artist',
      'venue',
      'partner',
      'label',
      'agency',
      'calendarEntry',
      'profile',
      'billingAddress',
      'paymentMethod',
      'order',
      'paymentTrace',
      'issuedTicket',
      'checkIn',
      'doorInvite',
      'product',
      'stockCount',
      'stockCorrection',
      'marketingConsent',
      'emailTemplate',
      'emailSend',
      'outsideParty',
      'artistOffer',
    ];
    for (const name of names) {
      assert.ok(name in schemas, name);
    }
    for (const name of publishedSchemas) {
      assert.equal((schemas[name] as readonly string[]).includes('secret'), false, name);
    }
  });

  it('parses a minimal party and rejects a missing date or a ticket secret', () => {
    assert.equal(parseParty(party).ok, true);
    assert.equal(parseParty(omit(party, 'dateStart')).ok, false);
    assert.equal(parseParty({ ...party, secret: 'ticket-secret' }).ok, false);
  });

  it('rejects a profile without a username or a name, and a role outside the three', () => {
    const parsed = parseProfile(profile('ada'));
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal('marketingConsent' in parsed.value, false);
    }
    assert.equal(parseProfile(omit(profile('ada'), 'username')).ok, false);
    assert.equal(parseProfile(omit(profile('ada'), 'givenName')).ok, false);
    assert.equal(parseProfile(profile('ada', { role: 'guest' })).ok, false);
    assert.equal(parseProfile(profile('ada', { marketingConsent: { consentedAt: '2026-11-08T00:00:00Z' } })).ok, false);
  });

  it('rejects a billing address without a country and a card number or CVC', () => {
    assert.equal(parseBillingAddress(address).ok, true);
    assert.equal(parseBillingAddress(omit(address, 'country')).ok, false);
    assert.equal(parsePaymentMethod({ ...paymentMethod, cardNumber: '4242424242424242' }).ok, false);
    assert.equal(parsePaymentMethod({ ...paymentMethod, cvc: '123' }).ok, false);
    assert.equal(parsePaymentMethod(paymentMethod).ok, true);
    const trace = {
      id: 'trace-1',
      userId: 'user-1',
      amount: 20,
      currency: 'USD',
      purpose: 'tickets',
      reference: 'ref-1',
      status: 'pending_provider',
    };
    assert.equal(parsePaymentTrace(trace).ok, true);
    assert.equal(parsePaymentTrace({ ...trace, status: 'confirmed' }).ok, false);
    assert.equal(parseParty({ ...party, draft: true }).ok, false);
  });

  it('parses a ticket id plus secret and rejects a public party id alone', () => {
    assert.equal(parseQrPayload({ id: 'ticket-1', secret: 'not-the-party' }).ok, true);
    assert.equal(parseQrPayload({ partyId: 'party-1' }).ok, false);
    assert.equal(parseQrPayload({ id: 'party-1' }).ok, false);
    assert.equal(ticketSecretMatches('not-the-party', 'not-the-party'), true);
    assert.equal(ticketSecretMatches('not-the-party', 'other-secret'), false);
  });

  it('checks marketing flags on the fixed templates', () => {
    assert.equal(parseEmailTemplate(template('new-party', false)).ok, false);
    assert.equal(parseEmailTemplate(template('ticket-purchase', true)).ok, false);
    assert.equal(parseEmailTemplate(template('new-party', true)).ok, true);
    assert.equal(parseEmailTemplate(template('ticket-purchase', false)).ok, true);
  });

  it('rejects an offer whose party id is a public event id', () => {
    const offer = { id: 'offer-1', outsidePartyId: 'party-1', artistId: 'artist-1' };
    assert.equal(parseArtistOffer(offer, { publicPartyIds: ['party-1'], artistIds: ['artist-1'] }).ok, false);
    assert.equal(
      parseArtistOffer(
        { ...offer, outsidePartyId: 'outside-1' },
        { publicPartyIds: ['party-1'], artistIds: ['artist-1'], outsidePartyIds: ['outside-1'] },
      ).ok,
      true,
    );
  });

  it('rejects a second username, stock row, or consent subject', () => {
    assert.equal(parseProfiles([profile('ada'), profile('ada', { sub: 'other', email: 'other@example.com' })]).ok, false);
    assert.equal(
      parseStockCounts([
        { productId: 'hw', size: 'M', count: 1 },
        { productId: 'hw', size: 'M', count: 2 },
      ]).ok,
      false,
    );
    assert.equal(
      parseStockCounts([
        { productId: 'hw', size: 'M', count: 1 },
        { productId: 'hw', size: 'G', count: 2 },
      ]).ok,
      true,
    );
    const tokenA = 'stop-token-aaaaaa';
    const tokenB = 'stop-token-bbbbbb';
    assert.equal(parseConsents([consent('c1', 'user-1', tokenA)]).ok, true);
    assert.equal(parseConsents([consent('c1', 'user-1', tokenA), consent('c2', 'user-1', tokenB)]).ok, false);
  });

  it('declares the ticket lookup by id and rejects a key on the secret', () => {
    assert.deepEqual(lookups.issuedTicketById.fields, ['id']);
    assert.equal(lookups.issuedTicketById.unique, true);
    assert.equal(declareLookup({ record: 'issuedTicket', fields: ['secret'], unique: true }).ok, false);
    assert.equal(declareLookup({ record: 'customers', fields: ['id'], unique: false }).ok, false);
    for (const lookup of Object.values(lookups)) {
      assert.equal(lookup.fields.includes('secret'), false);
      assert.equal(lookup.fields.includes('cardNumber'), false);
    }
  });

  it('rejects a reference to a missing id', () => {
    assert.equal(
      parseCalendarEntry(
        { id: 'cal-1', artistId: 'missing-artist', partyId: 'party-1' },
        { artistIds: ['artist-1'], partyIds: ['party-1'] },
      ).ok,
      false,
    );
  });
});
