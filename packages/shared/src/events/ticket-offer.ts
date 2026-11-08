import { getPrimaryTicketUrl, hasTicketSales, type PublicEventLinks } from './public-list.ts';

export interface TicketOfferInput {
  name: string;
  amount: number;
  currency?: string;
}

export interface EuroTicketOffer {
  name: string;
  amount: number;
  currency: 'EUR';
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
    offers.push(currency === undefined ? { name, amount } : { name, amount, currency });
  }
  return offers;
}

/** An in-app offer is priced in euro. A missing currency is not treated as euro. */
export function euroTicketOffers(offers: readonly TicketOfferInput[] | undefined): EuroTicketOffer[] {
  if (!offers) {
    return [];
  }
  const selected: EuroTicketOffer[] = [];
  for (const offer of offers) {
    const name = offer.name.trim();
    if (name === '' || name.length > 80 || offer.currency !== 'EUR' || !isPayableAmount(offer.amount)) {
      continue;
    }
    selected.push({ name, amount: offer.amount, currency: 'EUR' });
  }
  return selected;
}

/**
 * A published party with a euro offer is sold in the app.
 * Every other party keeps the external seller link.
 */
export function eventSaleChoice(links: PublicEventLinks, offers: unknown): EventSaleChoice {
  const inAppOffers = euroTicketOffers(readTicketOffers(offers));
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
