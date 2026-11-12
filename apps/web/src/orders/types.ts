export interface OrderLineView {
  kind: 'shop' | 'ticket';
  name: string;
  detail: string;
  quantity: number;
  image?: string;
  ticketId?: string;
}

export interface OrderCardView {
  id: string;
  createdAt: string;
  purpose: 'shop' | 'tickets';
  status: 'pending_provider' | 'confirmed';
  amount: number;
  currency: string;
  city: string;
  country: string;
  lines: readonly OrderLineView[];
  payHref?: { en: string; pt: string };
}

export interface AdminOrderCardView extends Omit<OrderCardView, 'payHref'> {
  buyer: string;
}
