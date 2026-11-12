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

function statusClass(status: OrderCardView['status']): string {
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
      <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ozora-cream/[0.04] p-1">
        {line.kind === 'shop' && line.image ? <img src={line.image} alt="" className="h-full w-full object-contain" /> : null}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="font-display text-lg font-bold text-ozora-cream">{line.name}</p>
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

export function MyOrders({ signedIn, orders }: { signedIn: boolean; orders: readonly OrderCardView[] }) {
  const { language } = useLanguage();
  const signInHref = useSignInHref();

  return (
    <section className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{areaText(language, 'my-orders')}</h1>
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
          <>
            <ul className="mt-6 space-y-4">
              {orders.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>
            <Button href={publicHref('/shop', language)} tone="ghost" className="mt-6">
              {shopText(language, 'continue')}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function OrderCard({ order }: { order: OrderCardView }) {
  const { language } = useLanguage();
  const place = [order.city, order.country]
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join(' · ');
  const href = payHref(order, language);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-ozora-navy/55">
      <header className="border-b border-white/10 bg-black/20 px-4 py-3 md:px-5">
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
              {orderText(language, 'placed')}
            </p>
            <time dateTime={order.createdAt} className="mt-0.5 block text-sm text-ozora-cream">
              {orderWhen(order.createdAt, language)}
            </time>
          </div>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
              {shopText(language, 'total')}
            </p>
            <p className="mt-0.5 font-bold text-ozora-yellow">{shopAmountLabel(order.amount, order.currency)}</p>
          </div>
          <div>
            {place !== '' ? (
              <>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
                  {orderText(language, 'shipsTo')}
                </p>
                <p className="mt-0.5 text-sm text-ozora-cream">{place}</p>
              </>
            ) : null}
            <p className={`${place !== '' ? 'mt-1' : ''} text-xs text-ozora-cream/50`}>{order.id}</p>
          </div>
          <div className="col-span-2 justify-self-start sm:col-span-1 sm:justify-self-end">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${statusClass(order.status)}`}>
              {statusLabel(order.status, language)}
            </span>
          </div>
        </div>
      </header>
      <ul className="space-y-4 px-4 py-5 md:px-5">
        {order.lines.map((line, index) => (
          <OrderLine key={`${order.id}-${index}`} line={line} />
        ))}
      </ul>
      {href ? (
        <footer className="border-t border-white/10 px-4 py-4 md:px-5">
          <div className="sm:flex sm:items-center sm:justify-between sm:gap-5">
            <p className="text-xs leading-relaxed text-ozora-cream/55">{orderText(language, 'payNowNote')}</p>
            <Button href={href} target="_blank" rel="noopener noreferrer" className="mt-3 shrink-0 sm:mt-0">
              {orderText(language, 'payNow')}
            </Button>
          </div>
        </footer>
      ) : null}
    </article>
  );
}
