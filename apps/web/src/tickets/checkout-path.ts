export function ticketCheckoutPath(eventId: string, offerName: string, quantity: number): string {
  const params = new URLSearchParams({ offer: offerName, qty: String(quantity) });
  return `/events/${encodeURIComponent(eventId)}/checkout?${params.toString()}`;
}
