import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { lookups, schemas } from 'tropical-nomads-shared';

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../database/migrations/001_schema.sql'), 'utf8');

const tableForSchema = {
  party: 'party',
  artist: 'artist',
  venue: 'venue',
  partner: 'partner',
  label: 'label',
  agency: 'agency',
  socialLink: 'social_link',
  calendarEntry: 'calendar_entry',
  profile: 'profile',
  billingAddress: 'billing_address',
  paymentMethod: 'payment_method',
  order: 'customer_order',
  paymentTrace: 'payment_trace',
  issuedTicket: 'issued_ticket',
  checkIn: 'check_in',
  doorInvite: 'door_invite',
  guestList: 'guest_list',
  product: 'product',
  stockCount: 'stock_count',
  stockCorrection: 'stock_correction',
  marketingConsent: 'marketing_consent',
  emailTemplate: 'email_template',
  emailSend: 'email_send',
  outsideParty: 'outside_party',
  artistOffer: 'artist_offer',
} as const;

describe('database migration', () => {
  it('creates a table for every shared schema', () => {
    for (const key of Object.keys(schemas)) {
      const table = tableForSchema[key as keyof typeof tableForSchema];
      assert.equal(table !== undefined, true, key);
      assert.match(sql, new RegExp(`create table ${table}\\b`));
    }
  });

  it('creates an index for every lookup and does not index a ticket secret', () => {
    for (const name of Object.keys(lookups)) {
      assert.match(sql, new RegExp(`\\blookup_${name.toLowerCase()}\\b`));
    }
    assert.equal(/on\s+issued_ticket\s*\([^)]*\bsecret\b/i.test(sql), false);
    assert.equal(/create\s+(unique\s+)?index\s+\S+\s+on\s+issued_ticket\s*\(\s*secret\s*\)/i.test(sql), false);
    const ticketing = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../database/migrations/002_ticketing.sql'), 'utf8');
    assert.match(ticketing, /origin text not null default 'catalog'/);
    assert.match(ticketing, /publication text not null default 'published'/);
    assert.match(ticketing, /revisions jsonb not null default '\[\]'::jsonb/);
    assert.match(ticketing, /secret_box text/);
    assert.equal(/index[\s\S]*secret_box/i.test(ticketing), false);
    const headliners = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../database/migrations/005_party_headliners.sql'), 'utf8');
    assert.match(headliners, /alter table party add column headliners jsonb/);
    const seed = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../database/seed.mjs'), 'utf8');
    assert.match(seed, /headliners/);
  });
});
