import { loteStatuses, type LoteOffer, type LoteStatus } from 'tropical-nomads-shared';
import { wallClock } from './event-time.ts';

const windowDays = 30;
const recentLimit = 5;

export interface EventDashboardOrderLine {
  kind: 'shop' | 'ticket';
  partyId?: string;
  detail: string;
  quantity: number;
}

export interface EventDashboardOrder {
  id: string;
  createdAt: string;
  status: 'pending_provider' | 'confirmed';
  amount: number;
  currency: string;
  buyer: string;
  purpose: 'shop' | 'tickets';
  lines: readonly EventDashboardOrderLine[];
}

export interface EventDashboardTicket {
  name: string;
  ticket?: string;
  sold: number;
  capacity: number;
  amount: number;
  status: LoteStatus;
  endsAt?: string;
}

export interface EventDashboardSale {
  id: string;
  createdAt: string;
  buyer: string;
  quantity: number;
  offerName: string;
  amount: number;
}

export interface EventDashboardDay {
  day: string;
  amount: number;
}

export interface EventDashboardModel {
  netSales: number;
  sold: number;
  capacity: number;
  series: EventDashboardDay[];
  tickets: EventDashboardTicket[];
  recentOrders: EventDashboardSale[];
}

export function initialEventTab(eventId: string | undefined): 'dashboard' | 'details' {
  return eventId !== undefined && eventId.trim() !== '' ? 'dashboard' : 'details';
}

function calendarDay(isoDate: string, delta: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return '';
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + delta);
  return utc.toISOString().slice(0, 10);
}

function dayOf(iso: string, timeZone: string): string {
  return wallClock(iso, timeZone).date;
}

function ticketLines(order: EventDashboardOrder, partyId: string): EventDashboardOrderLine[] {
  return order.lines.filter((line) => line.kind === 'ticket' && line.partyId === partyId);
}

function countsForEvent(order: EventDashboardOrder, partyId: string): boolean {
  return order.purpose === 'tickets' && order.status === 'confirmed' && order.currency === 'EUR' && ticketLines(order, partyId).length > 0;
}

export function buildEventDashboard(input: {
  partyId: string;
  offers: readonly LoteOffer[];
  sold: Readonly<Record<string, number>>;
  orders: readonly EventDashboardOrder[];
  now: Date;
  timeZone: string;
}): EventDashboardModel {
  const matched = input.orders.filter((order) => countsForEvent(order, input.partyId));
  let netSales = 0;
  for (const order of matched) {
    netSales += order.amount;
  }

  let sold = 0;
  let capacity = 0;
  for (const offer of input.offers) {
    sold += input.sold[offer.name] ?? 0;
    capacity += offer.capacity;
  }

  const statuses = loteStatuses(input.offers, input.sold, input.now);
  const tickets: EventDashboardTicket[] = input.offers.map((offer, index) => {
    const row: EventDashboardTicket = {
      name: offer.name,
      sold: input.sold[offer.name] ?? 0,
      capacity: offer.capacity,
      amount: offer.amount,
      status: statuses[index] ?? 'scheduled',
    };
    if (offer.ticket) {
      row.ticket = offer.ticket;
    }
    if (offer.endsAt) {
      row.endsAt = offer.endsAt;
    }
    return row;
  });

  const today = dayOf(input.now.toISOString(), input.timeZone);
  const series: EventDashboardDay[] = [];
  const indexByDay = new Map<string, number>();
  if (today !== '') {
    for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
      const day = calendarDay(today, -offset);
      indexByDay.set(day, series.length);
      series.push({ day, amount: 0 });
    }
  }
  for (const order of matched) {
    const index = indexByDay.get(dayOf(order.createdAt, input.timeZone));
    const point = index === undefined ? undefined : series[index];
    if (point) {
      point.amount += order.amount;
    }
  }

  const recentOrders = matched
    .slice()
    .sort((left, right) => {
      if (left.createdAt === right.createdAt) {
        return left.id < right.id ? 1 : left.id > right.id ? -1 : 0;
      }
      return left.createdAt < right.createdAt ? 1 : -1;
    })
    .slice(0, recentLimit)
    .map((order) => {
      const lines = ticketLines(order, input.partyId);
      const names: string[] = [];
      let quantity = 0;
      for (const line of lines) {
        quantity += line.quantity;
        if (line.detail !== '' && !names.includes(line.detail)) {
          names.push(line.detail);
        }
      }
      return {
        id: order.id,
        createdAt: order.createdAt,
        buyer: order.buyer,
        quantity,
        offerName: names.join(' · '),
        amount: order.amount,
      };
    });

  return { netSales, sold, capacity, series, tickets, recentOrders };
}
