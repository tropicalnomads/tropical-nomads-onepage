import type { InAppOffer } from './types.ts';

export function offersWithRemaining(
  offers: readonly { name: string; amount: number; currency: 'EUR'; capacity: number }[],
  sold: Readonly<Record<string, number>>,
): InAppOffer[] {
  return offers.map((offer) => {
    const soldCount = sold[offer.name] ?? 0;
    return {
      name: offer.name,
      amount: offer.amount,
      currency: offer.currency,
      capacity: offer.capacity,
      remaining: Math.max(0, offer.capacity - soldCount),
    };
  });
}

export function cheapestOffer(offers: readonly InAppOffer[]): InAppOffer | undefined {
  return offers.reduce<InAppOffer | undefined>((best, offer) => {
    if (best === undefined || offer.amount < best.amount) {
      return offer;
    }
    return best;
  }, undefined);
}
