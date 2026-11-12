import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { Order, PaymentTrace } from 'tropical-nomads-shared';
import { adminOrderViews, ownOrderViews, shopPayUrl } from '../src/order-views.ts';

const adaShop: Order = {
  id: 'order-aaaaaaaaaaaaaaaaaa',
  userId: 'ada',
  purpose: 'shop',
  lines: [{ kind: 'shop', productId: 'hw', size: 'M', quantity: 2 }],
  traceId: 'trace-aaaaaaaaaaaaaaaaaa',
  createdAt: '2026-11-12T10:00:00.000Z',
  delivery: { name: 'Ada Lovelace', line1: 'Rua da Loja 1', city: 'Lisbon', postalCode: '1000-001', country: 'Portugal' },
};

const adaPaid: Order = {
  id: 'order-bbbbbbbbbbbbbbbbbb',
  userId: 'ada',
  purpose: 'shop',
  lines: [{ kind: 'shop', productId: 'pg', size: 'G', quantity: 1 }],
  traceId: 'trace-bbbbbbbbbbbbbbbbbb',
  createdAt: '2026-11-11T10:00:00.000Z',
  delivery: { name: 'Ada Lovelace', line1: 'Rua da Loja 1', city: 'Lisbon', postalCode: '1000-001', country: 'Portugal' },
};

const adaTicket: Order = {
  id: 'order-cccccccccccccccccc',
  userId: 'ada',
  purpose: 'tickets',
  lines: [{ kind: 'ticket', partyId: 'party-1', offerName: 'Full pass', quantity: 1 }],
  traceId: 'trace-cccccccccccccccccc',
  createdAt: '2026-11-10T10:00:00.000Z',
};

const graceShop: Order = {
  id: 'order-dddddddddddddddddd',
  userId: 'sub-grace',
  purpose: 'shop',
  lines: [{ kind: 'shop', productId: 'hw', size: 'P', quantity: 1 }],
  traceId: 'trace-dddddddddddddddddd',
  createdAt: '2026-11-12T12:00:00.000Z',
  delivery: { name: 'Grace Hopper', line1: 'Rua 2', city: 'Porto', postalCode: '4000', country: 'Portugal' },
};

const traces: PaymentTrace[] = [
  { id: adaShop.traceId, userId: 'ada', amount: 100, currency: 'EUR', purpose: 'shop', reference: adaShop.id, status: 'pending_provider' },
  { id: adaPaid.traceId, userId: 'ada', amount: 50, currency: 'EUR', purpose: 'shop', reference: adaPaid.id, status: 'confirmed' },
  { id: adaTicket.traceId, userId: 'ada', amount: 40, currency: 'EUR', purpose: 'tickets', reference: adaTicket.id, status: 'pending_provider' },
  { id: graceShop.traceId, userId: 'sub-grace', amount: 50, currency: 'EUR', purpose: 'shop', reference: graceShop.id, status: 'pending_provider' },
];

describe('own order views', () => {
  it('keeps Ada’s ticket and shop orders, and leaves Grace and the door value out', () => {
    const doorValue = 'door-only-value';
    const views = ownOrderViews({
      userId: 'ada',
      orders: [graceShop, adaTicket, adaPaid, adaShop],
      traces,
      tickets: [{ id: 'ticket-aaaaaaaaaaaaaaaaaa', partyId: 'party-1', traceId: adaTicket.traceId, buyerId: 'ada' }],
      products: [{ id: 'hw', name: 'Halloween', image: '/shop/media/hw' }, { id: 'pg', name: 'Psy Groove', image: '/shop/media/pg' }],
      titles: new Map([['party-1', 'Friday']]),
    });
    assert.deepEqual(views.map((view) => view.id), [adaShop.id, adaPaid.id, adaTicket.id]);
    assert.equal(views[0]?.status, 'pending_provider');
    assert.equal(views[0]?.city, 'Lisbon');
    assert.equal(views[0]?.lines[0]?.name, 'Halloween');
    assert.equal(views[0]?.lines[0]?.image, '/shop/media/hw');
    assert.equal(views[1]?.pay, undefined);
    assert.equal(views[2]?.pay, undefined);
    assert.equal(views[2]?.lines[0]?.name, 'Friday');
    assert.equal(views[2]?.lines[0]?.ticketId, 'ticket-aaaaaaaaaaaaaaaaaa');
    const pay = views[0]?.pay?.en;
    assert.ok(pay);
    const url = shopPayUrl(pay);
    assert.equal(url.startsWith('https://wa.me/4917648996011?text='), true);
    assert.equal(decodeURIComponent(url.slice(url.indexOf('?text=') + 6)).includes(adaShop.id), true);
    assert.equal(pay.includes('€100'), true);
    assert.equal(JSON.stringify(views).includes(doorValue), false);
    assert.equal(JSON.stringify(views).includes('sub-grace'), false);
    assert.equal(JSON.stringify(views).includes('secret'), false);
  });

  it('names the buyer for an admin and does not include a pay link', () => {
    const views = adminOrderViews({
      orders: [adaShop, graceShop],
      traces,
      tickets: [],
      products: [],
      titles: new Map(),
      profiles: [{ sub: 'sub-grace', username: 'grace' }],
    });
    assert.equal(views.find((view) => view.id === adaShop.id)?.buyer, 'Ada Lovelace');
    assert.equal(views.find((view) => view.id === graceShop.id)?.buyer, 'Grace Hopper');
    assert.equal(JSON.stringify(views).includes('pay'), false);
    assert.equal(JSON.stringify(views).includes('sub-grace'), false);
    const source = readFileSync(new URL('../src/order-views.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('secret'), false);
  });
});
