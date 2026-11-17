import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { LoteOffer } from 'tropical-nomads-shared';
import { buildEventDashboard, initialEventTab, type EventDashboardOrder } from '../src/admin/event-dashboard.ts';

const now = new Date('2026-11-17T15:00:00.000Z');

function ticketOrder(input: Partial<EventDashboardOrder> & Pick<EventDashboardOrder, 'id' | 'createdAt' | 'amount'>): EventDashboardOrder {
  return {
    status: 'confirmed',
    currency: 'EUR',
    buyer: 'Ada',
    purpose: 'tickets',
    lines: [{ kind: 'ticket', partyId: 'party-1', detail: 'Door', quantity: 1 }],
    ...input,
  };
}

const door: LoteOffer[] = [
  { name: 'Early', amount: 15, currency: 'EUR', capacity: 2, ticket: 'Door' },
  { name: 'Final', amount: 25, currency: 'EUR', capacity: 10, ticket: 'Door', endsAt: '2026-11-20T23:59:00.000Z' },
];

describe('event dashboard', () => {
  it('opens an existing event on the dashboard and a new event on details', () => {
    assert.equal(initialEventTab('party-1'), 'dashboard');
    assert.equal(initialEventTab(undefined), 'details');
    assert.equal(initialEventTab('  '), 'details');
    const form = readFileSync(new URL('../src/components/AdminEventForm.tsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('../app/admin/events/[id]/page.tsx', import.meta.url), 'utf8');
    const fresh = readFileSync(new URL('../app/admin/events/new/page.tsx', import.meta.url), 'utf8');
    assert.equal(form.includes('initialEventTab(values.id)'), true);
    assert.ok(form.indexOf("text('dashboardTab')") < form.indexOf("text('detailsTab')"));
    assert.equal(form.includes("tab !== 'dashboard'"), true);
    assert.equal(page.includes('buildEventDashboard'), true);
    assert.equal(page.includes('loadAllOrders'), true);
    assert.equal(fresh.includes('buildEventDashboard'), false);
  });

  it('sums confirmed euro ticket orders for this event once', () => {
    const dashboard = buildEventDashboard({
      partyId: 'party-1',
      offers: door,
      sold: { Early: 2, Final: 1 },
      now,
      timeZone: 'America/Sao_Paulo',
      orders: [
        ticketOrder({ id: 'order-local', createdAt: '2026-11-17T01:30:00.000Z', amount: 40 }),
        ticketOrder({ id: 'order-today', createdAt: '2026-11-17T15:00:00.000Z', amount: 25, lines: [{ kind: 'ticket', partyId: 'party-1', detail: 'Final', quantity: 1 }] }),
        ticketOrder({ id: 'order-old', createdAt: '2026-10-18T15:00:00.000Z', amount: 10 }),
        ticketOrder({
          id: 'order-split',
          createdAt: '2026-11-10T12:00:00.000Z',
          amount: 30,
          lines: [
            { kind: 'ticket', partyId: 'party-1', detail: 'Early', quantity: 1 },
            { kind: 'ticket', partyId: 'party-1', detail: 'Final', quantity: 2 },
          ],
        }),
        ticketOrder({ id: 'order-other', createdAt: '2026-11-12T12:00:00.000Z', amount: 100, lines: [{ kind: 'ticket', partyId: 'party-2', detail: 'Door', quantity: 1 }] }),
        ticketOrder({ id: 'order-pending', createdAt: '2026-11-12T12:00:00.000Z', amount: 50, status: 'pending_provider' }),
        ticketOrder({ id: 'order-shop', createdAt: '2026-11-12T12:00:00.000Z', amount: 80, purpose: 'shop' }),
        ticketOrder({ id: 'order-usd', createdAt: '2026-11-12T12:00:00.000Z', amount: 70, currency: 'USD' }),
      ],
    });
    assert.equal(dashboard.netSales, 105);
    assert.equal(dashboard.sold, 3);
    assert.equal(dashboard.capacity, 12);
    assert.equal(dashboard.tickets[0]?.status, 'sold-out');
    assert.equal(dashboard.tickets[1]?.status, 'on-sale');
    assert.equal(dashboard.tickets[1]?.endsAt, '2026-11-20T23:59:00.000Z');
    assert.equal(dashboard.series.length, 30);
    assert.equal(dashboard.series[0]?.day, '2026-10-19');
    assert.equal(dashboard.series[28]?.day, '2026-11-16');
    assert.equal(dashboard.series[28]?.amount, 40);
    assert.equal(dashboard.series[29]?.day, '2026-11-17');
    assert.equal(dashboard.series[29]?.amount, 25);
    assert.equal(dashboard.series.some((point) => point.day === '2026-10-18'), false);
    const split = dashboard.recentOrders.find((order) => order.id === 'order-split');
    assert.equal(split?.quantity, 3);
    assert.equal(split?.offerName, 'Early · Final');
    assert.equal(split?.amount, 30);
    assert.equal(dashboard.recentOrders.some((order) => order.id === 'order-other' || order.id === 'order-pending' || order.id === 'order-shop' || order.id === 'order-usd'), false);
  });

  it('keeps the five newest orders and an empty month of zeros', () => {
    const orders = [1, 2, 3, 4, 5, 6].map((day) =>
      ticketOrder({
        id: `order-${day}`,
        createdAt: `2026-11-0${day}T12:00:00.000Z`,
        amount: day,
        buyer: `Buyer ${day}`,
      }),
    );
    const dashboard = buildEventDashboard({
      partyId: 'party-1',
      offers: [],
      sold: {},
      orders,
      now,
      timeZone: 'UTC',
    });
    assert.deepEqual(
      dashboard.recentOrders.map((order) => order.id),
      ['order-6', 'order-5', 'order-4', 'order-3', 'order-2'],
    );
    assert.equal(dashboard.recentOrders[0]?.buyer, 'Buyer 6');
    const empty = buildEventDashboard({
      partyId: 'party-1',
      offers: [],
      sold: {},
      orders: [],
      now: new Date('2026-01-05T12:00:00.000Z'),
      timeZone: 'UTC',
    });
    assert.equal(empty.netSales, 0);
    assert.equal(empty.sold, 0);
    assert.equal(empty.capacity, 0);
    assert.deepEqual(empty.tickets, []);
    assert.deepEqual(empty.recentOrders, []);
    assert.equal(empty.series.length, 30);
    assert.equal(empty.series[0]?.day, '2025-12-07');
    assert.equal(empty.series[29]?.day, '2026-01-05');
    assert.equal(empty.series.every((point) => point.amount === 0), true);
    const fallback = buildEventDashboard({
      partyId: 'party-1',
      offers: [],
      sold: {},
      orders: [],
      now,
      timeZone: 'Not/AZone',
    });
    assert.equal(fallback.series.length, 30);
    assert.equal(fallback.series[29]?.day, '2026-11-17');
  });
});
