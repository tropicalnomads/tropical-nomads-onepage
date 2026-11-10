export type LoteStatus = 'on-sale' | 'scheduled' | 'sold-out' | 'ended';

export interface LoteSource {
  name: string;
  amount: number;
  currency?: string;
  capacity?: number;
  ticket?: string;
  endsAt?: string;
}

export interface LoteOffer {
  name: string;
  amount: number;
  currency: 'EUR';
  capacity: number;
  ticket?: string;
  endsAt?: string;
}

function isCapacity(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100000;
}

function isPayable(amount: number): boolean {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return false;
  }
  return /^\d+(\.\d{1,2})?$/.test(amount.toString());
}

/** Euro offers that can be sold, keeping the type name and end date when they were stored. */
export function loteOffers(offers: readonly LoteSource[] | undefined): LoteOffer[] {
  if (!offers) {
    return [];
  }
  const selected: LoteOffer[] = [];
  for (const offer of offers) {
    const name = offer.name.trim();
    if (name === '' || name.length > 80 || offer.currency !== 'EUR' || !isPayable(offer.amount) || !isCapacity(offer.capacity)) {
      continue;
    }
    const ticket = offer.ticket?.trim();
    const endsAt = offer.endsAt?.trim();
    selected.push({
      name,
      amount: offer.amount,
      currency: 'EUR',
      capacity: offer.capacity,
      ...(ticket ? { ticket } : {}),
      ...(endsAt ? { endsAt } : {}),
    });
  }
  return selected;
}

function groupKey(offer: LoteOffer): string {
  const ticket = offer.ticket?.trim();
  return ticket ? `ticket:${ticket}` : `name:${offer.name}`;
}

function closedByDate(endsAt: string | undefined, now: Date): boolean {
  if (!endsAt) {
    return false;
  }
  const finish = new Date(endsAt).getTime();
  return !Number.isNaN(finish) && finish <= now.getTime();
}

/**
 * Array order is the sale order inside a ticket type.
 * A lote with no type name is its own ladder, so an older offer stays on sale until it sells out.
 * A lote closes when its quantity is sold or its end date passes, whichever is already true.
 * The next lote opens only after every earlier lote in that type has closed.
 */
export function loteStatuses(offers: readonly LoteOffer[], sold: Readonly<Record<string, number>>, now: Date): LoteStatus[] {
  const statuses = offers.map((): LoteStatus => 'scheduled');
  const groups = new Map<string, number[]>();
  offers.forEach((offer, index) => {
    const key = groupKey(offer);
    const indexes = groups.get(key) ?? [];
    indexes.push(index);
    groups.set(key, indexes);
  });
  for (const indexes of groups.values()) {
    let opened = false;
    for (const index of indexes) {
      const offer = offers[index];
      if (!offer) {
        continue;
      }
      const quantityClosed = (sold[offer.name] ?? 0) >= offer.capacity;
      const dateClosed = closedByDate(offer.endsAt, now);
      if (!opened && !quantityClosed && !dateClosed) {
        statuses[index] = 'on-sale';
        opened = true;
        continue;
      }
      if (!opened) {
        statuses[index] = quantityClosed ? 'sold-out' : 'ended';
        continue;
      }
      statuses[index] = 'scheduled';
    }
  }
  return statuses;
}

export function openLoteOffers(offers: readonly LoteSource[] | undefined, sold: Readonly<Record<string, number>>, now: Date): LoteOffer[] {
  const lotes = loteOffers(offers);
  const statuses = loteStatuses(lotes, sold, now);
  return lotes.filter((_offer, index) => statuses[index] === 'on-sale');
}

export function loteStatusFor(
  offers: readonly LoteOffer[],
  name: string,
  sold: Readonly<Record<string, number>>,
  now: Date,
): LoteStatus | undefined {
  const index = offers.findIndex((offer) => offer.name === name);
  if (index < 0) {
    return undefined;
  }
  return loteStatuses(offers, sold, now)[index];
}
