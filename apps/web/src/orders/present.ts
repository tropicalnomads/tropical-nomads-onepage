import type { AdminOrderView, OwnOrderView } from 'tropical-nomads-api/orders';
import { shopPayUrl } from 'tropical-nomads-api/shop-pay-url';
import type { AdminOrderCardView, OrderCardView, OrderLineView } from './types.ts';

function linesOf(view: OwnOrderView): OrderLineView[] {
  return view.lines.map((line) => {
    const next: OrderLineView = { kind: line.kind, name: line.name, detail: line.detail, quantity: line.quantity };
    if (line.image) {
      next.image = line.image;
    }
    if (line.ticketId) {
      next.ticketId = line.ticketId;
    }
    return next;
  });
}

export function ownOrderCards(views: readonly OwnOrderView[]): OrderCardView[] {
  return views.map((view) => {
    const card: OrderCardView = {
      id: view.id,
      createdAt: view.createdAt,
      purpose: view.purpose,
      status: view.status,
      amount: view.amount,
      currency: view.currency,
      city: view.city,
      country: view.country,
      lines: linesOf(view),
    };
    if (view.pay) {
      card.payHref = { en: shopPayUrl(view.pay.en), pt: shopPayUrl(view.pay.pt) };
    }
    return card;
  });
}

export function adminOrderCards(views: readonly AdminOrderView[]): AdminOrderCardView[] {
  return views.map((view) => ({
    id: view.id,
    createdAt: view.createdAt,
    purpose: view.purpose,
    status: view.status,
    amount: view.amount,
    currency: view.currency,
    city: view.city,
    country: view.country,
    lines: linesOf(view),
    buyer: view.buyer,
  }));
}
