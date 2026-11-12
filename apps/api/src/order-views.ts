import {
  decideAccess,
  type Order,
  type OrderDelivery,
  type PaymentPurpose,
  type PaymentTrace,
} from 'tropical-nomads-shared';
import { loadAccounts } from './accounts.ts';
import { databaseSettings } from './database.ts';
import { loadTraces } from './payments.ts';
import { requireShopAdmin } from './shop-products.ts';
import { reconcileUnpaidShopStock } from './shop-stock.ts';
import { readStoredProducts } from './sql-store.ts';
import { loadIssuedTickets, loadOrders, loadPartyTitles } from './tickets.ts';

const shopPayNumber = '4917648996011';

export interface OrderCatalogProduct {
  id: string;
  name: string;
  image?: string;
}

export interface OrderTicketRef {
  id: string;
  partyId: string;
  traceId: string;
  buyerId: string;
}

export interface OwnOrderLine {
  kind: 'shop' | 'ticket';
  name: string;
  detail: string;
  quantity: number;
  image?: string;
  ticketId?: string;
}

export interface OwnOrderView {
  id: string;
  createdAt: string;
  purpose: PaymentPurpose;
  status: PaymentTrace['status'];
  amount: number;
  currency: string;
  city: string;
  country: string;
  lines: OwnOrderLine[];
  pay?: { en: string; pt: string };
}

export interface AdminOrderView extends Omit<OwnOrderView, 'pay'> {
  buyer: string;
}

export interface OrderViewInput {
  userId?: string;
  orders: readonly Order[];
  traces: readonly PaymentTrace[];
  tickets: readonly OrderTicketRef[];
  products: readonly OrderCatalogProduct[];
  titles: ReadonlyMap<string, string>;
  profiles?: readonly { sub: string; username: string }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function money(amount: number, currency: string): string {
  return currency === 'EUR' ? `€${amount}` : `${amount} ${currency}`;
}

function sizeWord(size: string, language: 'en' | 'pt'): string {
  if (language === 'pt') {
    return size;
  }
  switch (size) {
    case 'P':
      return 'S';
    case 'M':
      return 'M';
    case 'G':
      return 'L';
    case 'GG':
      return 'XL';
    case '2XL':
      return '2XL';
    default:
      return size;
  }
}

function deliveryLines(delivery: OrderDelivery | undefined): string[] {
  if (!delivery) {
    return [];
  }
  return [delivery.name, delivery.line1, delivery.line2, delivery.city, delivery.region, delivery.postalCode, delivery.country].filter(
    (line): line is string => typeof line === 'string' && line.trim() !== '',
  );
}

function shopImage(product: OrderCatalogProduct | undefined): string | undefined {
  if (!product?.image?.startsWith('/shop/media/')) {
    return undefined;
  }
  const id = product.image.slice('/shop/media/'.length);
  return id === product.id && /^[A-Za-z0-9_-]{1,40}$/.test(id) ? product.image : undefined;
}

function payMessages(order: Order, lines: readonly OwnOrderLine[], amount: number, currency: string): { en: string; pt: string } | undefined {
  if (order.purpose !== 'shop' || lines.length === 0) {
    return undefined;
  }
  const write = (language: 'en' | 'pt'): string => {
    const heading = language === 'pt' ? 'Pedido da loja Tropical Nomads' : 'Tropical Nomads shop';
    const orderLine = language === 'pt' ? `Pedido ${order.id}` : `Order ${order.id}`;
    const deliveryLabel = language === 'pt' ? 'Entrega' : 'Delivery';
    const totalLabel = language === 'pt' ? 'Total' : 'Total';
    const rows = lines.flatMap((line) => {
      const size = line.kind === 'shop' && line.detail !== '' ? ` · ${sizeWord(line.detail, language)}` : '';
      return [`${line.quantity} × ${line.name}${size}`];
    });
    const address = deliveryLines(order.delivery);
    return [heading, '', orderLine, '', ...rows, '', ...(address.length > 0 ? [deliveryLabel, ...address, ''] : []), `${totalLabel} ${money(amount, currency)}`].join('\n');
  };
  return { en: write('en'), pt: write('pt') };
}

export function shopPayUrl(message: string): string {
  return `https://wa.me/${shopPayNumber}?text=${encodeURIComponent(message)}`;
}

function lineViews(order: Order, products: readonly OrderCatalogProduct[], titles: ReadonlyMap<string, string>, tickets: readonly OrderTicketRef[]): OwnOrderLine[] {
  const lines: OwnOrderLine[] = [];
  for (const line of order.lines) {
    switch (line.kind) {
      case 'shop': {
        const product = products.find((item) => item.id === line.productId);
        const image = shopImage(product);
        const view: OwnOrderLine = {
          kind: 'shop',
          name: product?.name ?? line.productId,
          detail: line.size,
          quantity: line.quantity,
        };
        if (image) {
          view.image = image;
        }
        lines.push(view);
        break;
      }
      case 'ticket': {
        const ticket = tickets.find((item) => item.buyerId === order.userId && item.traceId === order.traceId && item.partyId === line.partyId);
        const view: OwnOrderLine = {
          kind: 'ticket',
          name: titles.get(line.partyId) ?? line.partyId,
          detail: line.offerName,
          quantity: line.quantity,
        };
        if (ticket) {
          view.ticketId = ticket.id;
        }
        lines.push(view);
        break;
      }
      default: {
        const unexpected: never = line;
        return unexpected;
      }
    }
  }
  return lines;
}

export function ownOrderViews(input: OrderViewInput): OwnOrderView[] {
  const traces = new Map(input.traces.map((trace) => [trace.id, trace]));
  const views: OwnOrderView[] = [];
  for (const order of input.orders) {
    if (input.userId !== undefined && order.userId !== input.userId) {
      continue;
    }
    const trace = traces.get(order.traceId);
    if (!trace || trace.userId !== order.userId || trace.purpose !== order.purpose) {
      continue;
    }
    const lines = lineViews(order, input.products, input.titles, input.tickets);
    const view: OwnOrderView = {
      id: order.id,
      createdAt: order.createdAt,
      purpose: order.purpose,
      status: trace.status,
      amount: trace.amount,
      currency: trace.currency,
      city: order.delivery?.city ?? '',
      country: order.delivery?.country ?? '',
      lines,
    };
    if (trace.status === 'pending_provider') {
      const pay = payMessages(order, lines, trace.amount, trace.currency);
      if (pay) {
        view.pay = pay;
      }
    }
    views.push(view);
  }
  return views.sort((left, right) => (left.createdAt < right.createdAt ? 1 : left.createdAt > right.createdAt ? -1 : left.id < right.id ? 1 : -1));
}

export function adminOrderViews(input: OrderViewInput): AdminOrderView[] {
  const names = new Map((input.profiles ?? []).map((profile) => [profile.sub, profile.username]));
  const orders = new Map(input.orders.map((order) => [order.id, order]));
  return ownOrderViews(input).map((view) => {
    const order = orders.get(view.id);
    const deliveryName = order?.delivery?.name?.trim() ?? '';
    const username = order ? (names.get(order.userId) ?? '') : '';
    const buyer = deliveryName !== '' ? deliveryName : username;
    return {
      id: view.id,
      createdAt: view.createdAt,
      purpose: view.purpose,
      status: view.status,
      amount: view.amount,
      currency: view.currency,
      city: view.city,
      country: view.country,
      lines: view.lines,
      buyer,
    };
  });
}

function catalogProducts(rows: readonly unknown[]): OrderCatalogProduct[] {
  const products: OrderCatalogProduct[] = [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.id !== 'string' || row.id.trim() === '') {
      continue;
    }
    const name = typeof row.name === 'string' && row.name.trim() !== '' ? row.name : row.id;
    const product: OrderCatalogProduct = { id: row.id, name };
    if (typeof row.image === 'string') {
      product.image = row.image;
    }
    products.push(product);
  }
  return products;
}

async function viewInput(userId?: string): Promise<OrderViewInput> {
  const [orders, traces, tickets, titles, accounts, products] = await Promise.all([
    loadOrders(),
    loadTraces(),
    loadIssuedTickets(),
    loadPartyTitles(),
    loadAccounts(),
    databaseSettings() ? readStoredProducts() : Promise.resolve([]),
  ]);
  return {
    ...(userId ? { userId } : {}),
    orders,
    traces,
    tickets: tickets.map((ticket) => ({ id: ticket.id, partyId: ticket.partyId, traceId: ticket.traceId, buyerId: ticket.buyerId })),
    products: catalogProducts(products),
    titles,
    profiles: accounts.profiles.map((profile) => ({ sub: profile.sub, username: profile.username })),
  };
}

async function ownReader(sessionSub: string | undefined): Promise<string | undefined> {
  if (!sessionSub || sessionSub.trim() === '') {
    return undefined;
  }
  const accounts = await loadAccounts();
  const profile = accounts.profiles.find((item) => item.sub === sessionSub);
  if (!profile) {
    return undefined;
  }
  const decision = decideAccess({
    action: 'read-own-purchases',
    role: profile.role,
    actorId: profile.sub,
    subjectId: profile.sub,
  });
  if (decision.effect !== 'allow' || decision.actorId !== profile.sub) {
    return undefined;
  }
  return profile.sub;
}

export async function listOwnOrders(sessionSub: string | undefined): Promise<OwnOrderView[]> {
  const userId = await ownReader(sessionSub);
  if (!userId) {
    return [];
  }
  await reconcileUnpaidShopStock();
  return ownOrderViews(await viewInput(userId));
}

export { markOrderPaid } from './shop-stock.ts';

export async function listAdminOrders(sessionSub: string | undefined): Promise<AdminOrderView[]> {
  await requireShopAdmin(sessionSub);
  await reconcileUnpaidShopStock();
  return adminOrderViews(await viewInput());
}
