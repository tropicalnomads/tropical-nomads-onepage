import { openLoteOffers } from './ticket-lotes.ts';
import { getPrimaryTicketUrl, hasTicketSales, type PublicEventLinks } from './public-list.ts';

export interface TicketOfferInput {
  name: string;
  amount: number;
  currency?: string;
  capacity?: number;
  ticket?: string;
  endsAt?: string;
}

export interface EuroTicketOffer {
  name: string;
  amount: number;
  currency: 'EUR';
  capacity: number;
}

export interface EventSaleChoice {
  inAppOffers: readonly EuroTicketOffer[];
  ticketUrl?: string;
  ticketsOnSale: boolean;
}

/** Same amount rule as `startPayment`: a positive value with at most two decimal places. */
export function isPayableAmount(amount: number): boolean {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return false;
  }
  return /^\d+(\.\d{1,2})?$/.test(amount.toString());
}

export function readTicketOffers(value: unknown): TicketOfferInput[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const offers: TicketOfferInput[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name : '';
    const amount = typeof record.amount === 'number' ? record.amount : Number.NaN;
    const currency = typeof record.currency === 'string' ? record.currency : undefined;
    const capacity = typeof record.capacity === 'number' ? record.capacity : undefined;
    const ticket = typeof record.ticket === 'string' ? record.ticket : undefined;
    const endsAt = typeof record.endsAt === 'string' ? record.endsAt : undefined;
    const offer: TicketOfferInput = currency === undefined ? { name, amount } : { name, amount, currency };
    if (capacity !== undefined) {
      offer.capacity = capacity;
    }
    if (ticket !== undefined) {
      offer.ticket = ticket;
    }
    if (endsAt !== undefined) {
      offer.endsAt = endsAt;
    }
    offers.push(offer);
  }
  return offers;
}

function isCapacity(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100000;
}

/** An in-app offer is priced in euro and has a positive capacity. A missing currency is not treated as euro. */
export function euroTicketOffers(offers: readonly TicketOfferInput[] | undefined): EuroTicketOffer[] {
  if (!offers) {
    return [];
  }
  const selected: EuroTicketOffer[] = [];
  for (const offer of offers) {
    const name = offer.name.trim();
    if (name === '' || name.length > 80 || offer.currency !== 'EUR' || !isPayableAmount(offer.amount) || !isCapacity(offer.capacity)) {
      continue;
    }
    selected.push({ name, amount: offer.amount, currency: 'EUR', capacity: offer.capacity });
  }
  return selected;
}

/**
 * A published party with a euro offer is sold in the app.
 * Every other party keeps the external seller link.
 */
export function eventSaleChoice(
  links: PublicEventLinks,
  offers: unknown,
  now: Date = new Date(),
  sold: Readonly<Record<string, number>> = {},
): EventSaleChoice {
  const inAppOffers = openLoteOffers(readTicketOffers(offers), sold, now).map((offer) => ({
    name: offer.name,
    amount: offer.amount,
    currency: offer.currency,
    capacity: offer.capacity,
  }));
  if (inAppOffers.length > 0) {
    return { inAppOffers, ticketsOnSale: false };
  }
  const ticketUrl = getPrimaryTicketUrl(links);
  return {
    inAppOffers,
    ticketsOnSale: hasTicketSales(links),
    ...(ticketUrl ? { ticketUrl } : {}),
  };
}
