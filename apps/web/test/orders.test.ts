import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { shellCopy } from '../src/i18n/copy.ts';
import { robotDisallows } from '../src/seo/robots.ts';
import { isPublicPath } from '../src/seo/urls.ts';
import { sitemapXml } from '../src/seo/sitemap.ts';

describe('my orders', () => {
  it('keeps the page private and linked from the account menu and the shop confirmation', () => {
    const header = readFileSync(new URL('../src/components/ShellHeader.tsx', import.meta.url), 'utf8');
    const complete = readFileSync(new URL('../src/components/ShopOrderComplete.tsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('../app/my-orders/page.tsx', import.meta.url), 'utf8');
    const orders = readFileSync(new URL('../src/components/MyOrders.tsx', import.meta.url), 'utf8');
    const tickets = readFileSync(new URL('../src/components/MyTickets.tsx', import.meta.url), 'utf8');
    assert.equal(header.includes('href="/my-orders"'), true);
    assert.equal(header.indexOf('href="/my-tickets"') < header.indexOf('href="/my-orders"'), true);
    assert.equal(complete.includes('href="/my-orders"'), true);
    assert.equal(page.includes('loadSnapshot'), false);
    assert.equal(page.includes('searchParams'), true);
    assert.equal(page.includes("purpose === 'shop'"), true);
    assert.equal(page.includes('own-orders') || page.includes('loadOwnOrders'), true);
    assert.equal(orders.includes('md:grid-cols-[16rem_minmax(0,1fr)]'), true);
    assert.equal(tickets.includes('md:grid-cols-[16rem_minmax(0,1fr)]'), true);
    assert.equal(orders.includes('text-2xl font-bold text-ozora-cream md:text-3xl'), true);
    assert.equal(tickets.includes('text-2xl font-bold text-ozora-cream md:text-3xl'), true);
    assert.equal(orders.includes("publicHref('/shop', language)"), true);
    assert.equal(tickets.includes("publicHref('/upcoming-events', language)"), true);
    assert.equal(tickets.includes("shellText(language, 'calendar')"), true);
    assert.equal(orders.includes('shopOrderMessage'), false);
    assert.equal(orders.includes('wa.me'), false);
    assert.equal(isPublicPath('/my-orders'), false);
    assert.equal(robotDisallows.includes('/my-orders'), true);
    assert.equal(sitemapXml().includes('/my-orders'), false);
    assert.equal(shellCopy.en.areas['my-orders'], 'My orders');
    assert.equal(shellCopy.pt.areas['my-orders'], 'Meus pedidos');
    assert.equal(shellCopy.en.orders.payNow, 'Pay now');
    assert.equal(shellCopy.pt.orders.payNow, 'Pagar agora');
    assert.deepEqual(Object.keys(shellCopy.en.orders).sort(), Object.keys(shellCopy.pt.orders).sort());
  });

  it('lets an admin mark an order paid from the order id alone', () => {
    const page = readFileSync(new URL('../app/admin/orders/page.tsx', import.meta.url), 'utf8');
    const action = readFileSync(new URL('../src/admin/order-actions.ts', import.meta.url), 'utf8');
    const view = readFileSync(new URL('../src/components/AdminOrders.tsx', import.meta.url), 'utf8');
    const shop = readFileSync(new URL('../src/components/AdminShopOrders.tsx', import.meta.url), 'utf8');
    assert.equal(page.includes('loadAllOrders'), true);
    assert.equal(page.includes('loadSnapshot'), false);
    assert.equal(action.includes("callPrivate('mark-order-paid', { orderId })"), true);
    assert.equal(action.includes('userId'), false);
    assert.equal(action.includes('markPaymentConfirmed'), false);
    assert.equal(view.includes('markOrderPaidAction'), true);
    assert.equal(view.includes('Pay now'), false);
    assert.equal(view.includes('wa.me'), false);
    assert.equal(shop.includes('href="/admin/orders"'), true);
    assert.equal(shop.includes('order.buyer'), false);
  });
});
