'use client';

import type { Locale } from 'tropical-nomads-shared';
import { useSignInHref } from '../account/use-return-path';
import { accountText, areaText, orderText } from '../i18n/copy';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { orderSizeLabel, orderWhen } from '../orders/format';
import type { OrderCardView, OrderLineView } from '../orders/types';
import { shopAmountLabel } from '../shop/catalog';
import { publicHref } from '../seo/urls';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';
import { Button } from './ui/Button';

function statusLabel(status: OrderCardView['status'], language: Locale): string {
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

function payHref(order: OrderCardView, language: Locale): string | undefined {
  if (!order.payHref) {
    return undefined;
  }
  switch (language) {
    case 'en':
      return order.payHref.en;
    case 'pt':
      return order.payHref.pt;
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

function orderTitle(order: OrderCardView): string {
  const names = order.lines.map((line) => line.name).filter((name) => name.trim() !== '');
  if (names.length === 0) {
    return order.id;
  }
  if (names.length === 1) {
    return names[0] ?? order.id;
  }
  return `${names[0]} +${names.length - 1}`;
}

function lineSize(line: OrderLineView, language: Locale): string | undefined {
  switch (line.kind) {
    case 'shop':
      return orderSizeLabel(line.detail, language);
    case 'ticket':
      return line.detail.trim() === '' ? undefined : line.detail;
    default: {
      const unexpected: never = line.kind;
      return unexpected;
    }
  }
}

function OrderLine({ line }: { line: OrderLineView }) {
  const { language } = useLanguage();
  const size = lineSize(line, language);
  return (
    <li className="flex gap-4">
      <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF8E7] p-1">
        {line.kind === 'shop' && line.image ? <img src={line.image} alt="" className="h-full w-full object-contain" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ozora-cream">{line.name}</p>
        {size ? (
          <p className="mt-1 text-sm text-ozora-cream/75">
            {shopText(language, 'size')} {size}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-ozora-cream/75">
          {shopText(language, 'quantity')} {line.quantity}
        </p>
      </div>
    </li>
  );
}

export function MyOrders({ signedIn, orders, selectedId }: { signedIn: boolean; orders: readonly OrderCardView[]; selectedId?: string }) {
  const { language } = useLanguage();
  const signInHref = useSignInHref();
  const label = areaText(language, 'my-orders');
  const open = orders.find((order) => order.id === selectedId);

  return (
    <section className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{label}</h1>
        {!signedIn ? (
          <div className="mt-6">
            <EmptyState title={orderText(language, 'signInTitle')} description={orderText(language, 'signInBody')} />
            <Button href={signInHref} className="mt-4">
              {accountText(language, 'signIn')}
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={orderText(language, 'emptyTitle')} description={orderText(language, 'emptyBody')}>
              <Button href={publicHref('/shop', language)}>{orderText(language, 'browse')}</Button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
            <ul className="space-y-2">
              {orders.map((order) => {
                const selected = order.id === open?.id;
                const size = order.lines[0] ? lineSize(order.lines[0], language) : undefined;
                return (
                  <li key={order.id}>
                    <a
                      href={`/my-orders?order=${order.id}`}
                      className={`block rounded-xl border px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise ${
                        selected ? 'border-ozora-yellow/60 bg-ozora-yellow/10' : 'border-white/10 bg-black/20'
                      }`}
                    >
                      <span className="block font-semibold text-ozora-cream">{orderTitle(order)}</span>
                      {size ? <span className="mt-1 block text-sm text-ozora-cream/75">{size}</span> : null}
                      <time dateTime={order.createdAt} className="mt-1 block text-xs text-ozora-cream/60">
                        {orderWhen(order.createdAt, language)}
                      </time>
                    </a>
                  </li>
                );
              })}
            </ul>
            {open ? (
              <OrderDetail order={open} />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function OrderDetail({ order }: { order: OrderCardView }) {
  const { language } = useLanguage();
  const place = [order.city, order.country].filter((part) => part.trim() !== '').join(' · ');
  const href = payHref(order, language);
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-ozora-cream">{orderTitle(order)}</h2>
      <p className="mt-2 text-sm text-ozora-yellow">{statusLabel(order.status, language)}</p>
      {href ? <p className="mt-1 text-sm text-ozora-cream/80">{orderText(language, 'payNowNote')}</p> : null}
      {place !== '' ? <p className="mt-1 text-sm text-ozora-cream/80">{place}</p> : null}
      <ul className="mt-4 space-y-3">
        {order.lines.map((line, index) => (
          <OrderLine key={`${order.id}-${index}`} line={line} />
        ))}
      </ul>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-ozora-cream/60">{shopText(language, 'total')}</p>
      <p className="text-2xl font-bold text-ozora-yellow">{shopAmountLabel(order.amount, order.currency)}</p>
      {href ? (
        <Button href={href} target="_blank" rel="noopener noreferrer" className="mt-4">
          {orderText(language, 'payNow')}
        </Button>
      ) : null}
      <Button href="/my-orders" tone="back" size="sm" className="mt-4">
        {orderText(language, 'openOrders')}
      </Button>
    </article>
  );
}
