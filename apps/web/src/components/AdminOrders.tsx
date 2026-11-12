'use client';

import { Ticket } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from 'tropical-nomads-shared';
import { markOrderPaidAction, type MarkPaidResult } from '../admin/order-actions';
import { orderText } from '../i18n/copy';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { orderSizeLabel, orderWhen } from '../orders/format';
import type { AdminOrderCardView, OrderLineView } from '../orders/types';
import { shopAmountLabel } from '../shop/catalog';
import { AdminFrame, type AdminTab } from './AdminFrame';
import { Button } from './ui/Button';

function statusClass(status: AdminOrderCardView['status']): string {
  switch (status) {
    case 'pending_provider':
      return 'bg-ozora-yellow/10 text-ozora-yellow';
    case 'confirmed':
      return 'bg-emerald-400/10 text-emerald-300';
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
}

function statusLabel(status: AdminOrderCardView['status'], language: Locale): string {
  switch (status) {
    case 'pending_provider':
      return shopText(language, 'unpaid');
    case 'confirmed':
      return shopText(language, 'paid');
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
}

function failureText(reason: Exclude<MarkPaidResult, { ok: true }>['reason'], language: Locale): string {
  switch (reason) {
    case 'sold-out':
      return orderText(language, 'soldOut');
    case 'denied':
    case 'unavailable':
      return orderText(language, 'markFailed');
    default: {
      const unexpected: never = reason;
      return unexpected;
    }
  }
}

function LineThumb({ line }: { line: OrderLineView }) {
  switch (line.kind) {
    case 'shop':
      return line.image ? <img src={line.image} alt="" className="h-full w-full object-contain" /> : null;
    case 'ticket':
      return <Ticket className="text-ozora-yellow" size={28} aria-hidden="true" />;
    default: {
      const unexpected: never = line.kind;
      return unexpected;
    }
  }
}

function OrderLine({ line }: { line: OrderLineView }) {
  const { language } = useLanguage();
  const size = line.kind === 'shop' ? orderSizeLabel(line.detail, language) : undefined;
  return (
    <li className="flex gap-4">
      <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl bg-ozora-cream/[0.04] p-1">
        <LineThumb line={line} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold text-ozora-cream">{line.name}</p>
        {size ? (
          <p className="text-sm text-ozora-cream/65">
            {shopText(language, 'size')} {size}
          </p>
        ) : null}
        {line.kind === 'ticket' && line.detail !== '' ? <p className="text-sm text-ozora-cream/65">{line.detail}</p> : null}
        <p className="text-sm text-ozora-cream/65">
          {shopText(language, 'quantity')} {line.quantity}
        </p>
      </div>
    </li>
  );
}

function OrderCard({
  order,
  pending,
  failure,
  onMark,
}: {
  order: AdminOrderCardView;
  pending: boolean;
  failure?: Exclude<MarkPaidResult, { ok: true }>['reason'];
  onMark: (orderId: string) => void;
}) {
  const { language } = useLanguage();
  const place = [order.city, order.country].filter((part) => part.trim() !== '').join(' · ');
  const buyer = order.buyer.trim();
  return (
    <article className="rounded-3xl border border-white/10 bg-ozora-navy/55 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ozora-cream">{order.id}</h2>
          <time dateTime={order.createdAt} className="mt-1 block text-sm text-ozora-cream/65">
            {orderWhen(order.createdAt, language)}
          </time>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${statusClass(order.status)}`}>
          {statusLabel(order.status, language)}
        </span>
      </header>
      {buyer !== '' ? <p className="mt-3 text-sm text-ozora-cream/80">{buyer}</p> : null}
      {place !== '' ? <p className="mt-1 text-sm text-ozora-cream/70">{place}</p> : null}
      <ul className="mt-4 space-y-3">
        {order.lines.map((line, index) => (
          <OrderLine key={`${order.id}-${index}`} line={line} />
        ))}
      </ul>
      <footer className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ozora-cream/60">{shopText(language, 'total')}</p>
          <p className="text-2xl font-bold text-ozora-yellow">{shopAmountLabel(order.amount, order.currency)}</p>
        </div>
        {order.status === 'pending_provider' ? (
          <div className="sm:max-w-xs sm:text-right">
            <Button type="button" disabled={pending} onClick={() => onMark(order.id)}>
              {pending ? orderText(language, 'markingPaid') : orderText(language, 'markPaid')}
            </Button>
            {failure ? <p className="mt-2 text-sm text-ozora-coral">{failureText(failure, language)}</p> : null}
          </div>
        ) : null}
      </footer>
    </article>
  );
}

function OrderGroup({ title, orders, pendingId, failure, onMark }: { title: string; orders: readonly AdminOrderCardView[]; pendingId?: string; failure?: { id: string; reason: Exclude<MarkPaidResult, { ok: true }>['reason'] }; onMark: (orderId: string) => void }) {
  if (orders.length === 0) {
    return null;
  }
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-bold text-ozora-cream">{title}</h2>
      <div className="mt-4 space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} pending={pendingId === order.id} failure={failure?.id === order.id ? failure.reason : undefined} onMark={onMark} />
        ))}
      </div>
    </section>
  );
}

export function AdminOrders({ orders }: { orders: readonly AdminOrderCardView[] }) {
  const { language } = useLanguage();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string>();
  const [failure, setFailure] = useState<{ id: string; reason: Exclude<MarkPaidResult, { ok: true }>['reason'] }>();
  const unpaid = orders.filter((order) => order.status === 'pending_provider');
  const paid = orders.filter((order) => order.status === 'confirmed');

  function onTab(next: AdminTab): void {
    switch (next) {
      case 'orders':
        return;
      case 'events':
        router.push('/admin/events');
        return;
      case 'shop':
        router.push('/admin/shops');
        return;
      default: {
        const unexpected: never = next;
        return unexpected;
      }
    }
  }

  async function mark(orderId: string): Promise<void> {
    if (pendingId) {
      return;
    }
    setPendingId(orderId);
    setFailure(undefined);
    try {
      const result = await markOrderPaidAction(orderId);
      if (!result.ok) {
        setFailure({ id: orderId, reason: result.reason });
        return;
      }
      router.refresh();
    } catch {
      setFailure({ id: orderId, reason: 'unavailable' });
    } finally {
      setPendingId(undefined);
    }
  }

  return (
    <AdminFrame tab="orders" onTab={onTab}>
      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-ozora-cream/75">{orderText(language, 'emptyAdmin')}</p>
      ) : (
        <>
          <OrderGroup title={shopText(language, 'unpaid')} orders={unpaid} pendingId={pendingId} failure={failure} onMark={(orderId) => void mark(orderId)} />
          <OrderGroup title={shopText(language, 'paid')} orders={paid} pendingId={pendingId} failure={failure} onMark={(orderId) => void mark(orderId)} />
        </>
      )}
    </AdminFrame>
  );
}
