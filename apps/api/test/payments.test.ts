import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { VerifiedSignIn } from 'tropical-nomads-shared';
import { api } from '../src/app.ts';
import { emptyAccounts, readAccounts, registerVerifiedAccount, saveDefaultBillingAddress, writeAccounts, type AccountFile } from '../src/accounts.ts';
import {
  attachPaymentMethod,
  commitPayment,
  createCustomer,
  adminTraceRows,
  listPaymentMethods,
  listTraces,
  markPaymentConfirmed,
  readTraces,
  recordRefund,
  startShopPayment,
  startTicketPayment,
  type PaymentCaller,
  type PaymentDraft,
} from '../src/payments.ts';

const now = '2026-11-08T18:00:00.000Z';
const cardNumber = '4111111111111111';

function caller(actorId = 'sub-ada', role: PaymentCaller['role'] = 'user'): PaymentCaller {
  return { role, actorId };
}

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

function billedFile(): AccountFile {
  const registered = registerVerifiedAccount(emptyAccounts(), signIn('ada'), [], now);
  return saveDefaultBillingAddress(
    registered,
    'sub-ada',
    { recipientName: 'Ada Nomad', line1: '1 Quay', city: 'Dublin', region: 'Leinster', postalCode: 'D01', country: 'IE' },
    now,
  );
}

function draft(overrides: Partial<PaymentDraft> = {}): PaymentDraft {
  return { userId: 'sub-ada', amount: 12.5, currency: 'usd', reference: 'party-1', ...overrides };
}

function method(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { type: 'card', brand: 'Visa', last4: '4242', expiryMonth: 12, expiryYear: 2030, ...overrides };
}

describe('payment interfaces', () => {
  it('starts a pending trace for tickets and for shop, and ignores a confirmed status', () => {
    const file = billedFile();
    const tickets = startTicketPayment(file, [], { ...draft(), status: 'confirmed' }, caller());
    const shop = startShopPayment(file, tickets.traces, draft({ amount: 50, currency: 'brl', reference: 'shirt-1' }), caller());
    assert.equal(tickets.trace.purpose, 'tickets');
    assert.equal(tickets.trace.amount, 12.5);
    assert.equal(tickets.trace.currency, 'USD');
    assert.equal(tickets.trace.userId, 'sub-ada');
    assert.equal(tickets.trace.status, 'pending_provider');
    assert.equal(listTraces(caller(), [{ ...tickets.trace, status: 'confirmed' }], 'sub-ada')[0]?.status, 'confirmed');
    assert.equal(shop.trace.purpose, 'shop');
    assert.equal(shop.trace.currency, 'BRL');
    assert.equal(shop.trace.status, 'pending_provider');
    assert.equal(shop.traces.length, 2);
    const confirmed = markPaymentConfirmed(shop.traces, tickets.trace.id, 'adapter-ref');
    assert.equal(confirmed.every((trace) => trace.status === 'pending_provider'), true);
    assert.equal(JSON.stringify(confirmed).includes('adapter-ref'), false);
    assert.deepEqual(recordRefund(tickets.trace.id), { applied: false });
    assert.equal(shop.traces[0]?.status, 'pending_provider');
  });

  it('rejects a card number, a missing billing address, and a payment by another person', () => {
    const file = billedFile();
    const before = JSON.stringify(file);
    assert.throws(() => attachPaymentMethod(file, caller(), 'sub-ada', method({ cardNumber })), /card number/);
    assert.throws(() => attachPaymentMethod(file, caller(), 'sub-ada', method({ cvc: '123' })), /card number/);
    assert.throws(() => attachPaymentMethod(file, caller(), 'sub-ada', method({ last4: cardNumber })), /card number/);
    assert.equal(JSON.stringify(file), before);
    const noBilling = registerVerifiedAccount(emptyAccounts(), signIn('ada'), [], now);
    assert.throws(() => startTicketPayment(noBilling, [], draft(), caller()), /billing address/);
    assert.throws(() => startTicketPayment(file, [], draft({ userId: 'sub-grace' }), caller()), /not allowed/);
    assert.throws(() => listPaymentMethods(file, caller('sub-grace'), 'sub-ada'), /not allowed/);
    const disabled = {
      ...file,
      profiles: file.profiles.map((profile) => ({ ...profile, status: 'disabled' as const })),
    };
    assert.throws(() => startShopPayment(disabled, [], draft(), caller()), /not allowed/);
    assert.throws(() => startTicketPayment(file, [], draft(), caller('admin-1', 'admin')), /not allowed/);
  });

  it('stores one method, keeps traces private, and lets a buyer read only their own', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-payments-'));
    writeAccounts(billedFile(), root);
    writeFileSync(join(root, 'payment-traces.json'), `${JSON.stringify({ schemaVersion: 1, records: [] })}\n`);
    const customer = createCustomer(readAccounts(root), caller(), 'sub-ada');
    assert.equal(customer.providerCustomerReference, 'local:sub-ada');
    assert.equal(readAccounts(root).paymentMethods.length, 0);
    const saved = attachPaymentMethod(readAccounts(root), caller(), 'sub-ada', method());
    writeAccounts(saved, root);
    assert.equal(listPaymentMethods(readAccounts(root), caller(), 'sub-ada')[0]?.last4, '4242');
    assert.equal(JSON.stringify(readAccounts(root)).includes(cardNumber), false);
    const [first, second] = await Promise.all([
      commitPayment('tickets', draft({ reference: 'party-1' }), caller(), root),
      commitPayment('shop', draft({ reference: 'shirt-1', currency: 'EUR' }), caller(), root),
    ]);
    const traces = readTraces(root);
    assert.equal(traces.length, 2);
    assert.deepEqual([first.status, second.status], ['pending_provider', 'pending_provider']);
    assert.equal(listTraces(caller(), traces, 'sub-ada').length, 2);
    assert.equal(listTraces({ role: 'admin', actorId: 'admin-1' }, traces, '').length, 2);
    const rows = adminTraceRows({ role: 'admin', actorId: 'admin-1' }, traces, [{ sub: 'sub-ada', username: 'ada' }]);
    assert.equal(rows.length, 2);
    assert.equal(rows.every((row) => row.username === 'ada' && row.status === 'pending_provider'), true);
    assert.equal(JSON.stringify(rows).includes('sub-ada'), false);
    assert.throws(() => adminTraceRows(caller(), traces, []), /not allowed/);
    assert.throws(() => adminTraceRows({ role: 'door', actorId: 'door-1' }, traces, []), /not allowed/);
    assert.throws(() => listTraces(caller(), traces, 'sub-grace'), /not allowed/);
    assert.throws(() => listTraces({ role: 'door', actorId: 'door-1' }, traces, 'door-1'), /not allowed/);
    const committed = readFileSync(new URL('../../../data/operational/payment-traces.json', import.meta.url), 'utf8');
    const profiles = readFileSync(new URL('../../../data/operational/profiles.json', import.meta.url), 'utf8');
    assert.equal(JSON.parse(committed).records.length, 0);
    assert.equal(JSON.parse(profiles).paymentMethods.length, 0);
    assert.equal((await api.request('/payment-traces')).status, 404);
    assert.equal((await api.request('/payments', { method: 'POST' })).status, 405);
    const paymentSource = readFileSync(new URL('../src/payments.ts', import.meta.url), 'utf8');
    assert.equal(paymentSource.includes('return startPayment('), true);
    const publicEvents = readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8');
    assert.equal(publicEvents.includes('pending_provider'), false);
    const packages = ['package.json', 'apps/api/package.json', 'apps/web/package.json', 'apps/one-pager/package.json', 'packages/shared/package.json'];
    for (const file of packages) {
      const text = readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8').toLowerCase();
      assert.equal(text.includes('stripe'), false, file);
      assert.equal(text.includes('paypal'), false, file);
      assert.equal(text.includes('adyen'), false, file);
      assert.equal(text.includes('mollie'), false, file);
    }
  });
});
