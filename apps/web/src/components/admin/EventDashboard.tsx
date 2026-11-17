'use client';

import { CalendarDays, Check, Copy, Link2 } from 'lucide-react';
import { useState } from 'react';
import type { Locale, LoteStatus } from 'tropical-nomads-shared';
import type { EventDashboardDay, EventDashboardModel } from '../../admin/event-dashboard';
import { wallClock } from '../../admin/event-time';
import { adminText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { orderWhen } from '../../orders/format';
import { Button } from '../ui/Button';

function euro(amount: number, language: Locale): string {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDay(day: string, language: Locale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) {
    return day;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  return new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, date)),
  );
}

function statusText(status: LoteStatus, text: (key: Parameters<typeof adminText>[1]) => string): string {
  switch (status) {
    case 'on-sale':
      return text('onSale');
    case 'scheduled':
      return text('scheduled');
    case 'sold-out':
      return text('soldOut');
    case 'ended':
      return text('loteEnded');
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
}

const statusClass: Record<LoteStatus, string> = {
  'on-sale': 'border-ozora-turquoise/30 bg-ozora-turquoise/10 text-ozora-turquoise',
  scheduled: 'border-ozora-yellow/30 bg-ozora-yellow/10 text-ozora-yellow',
  'sold-out': 'border-ozora-coral/30 bg-ozora-coral/10 text-ozora-coral',
  ended: 'border-white/10 bg-white/[0.04] text-ozora-cream/55',
};

function SalesTrend({ series, label }: { series: readonly EventDashboardDay[]; label: string }) {
  const width = 640;
  const height = 180;
  const padX = 6;
  const padTop = 12;
  const innerW = width - padX * 2;
  const innerH = height - padTop - 8;
  const max = series.reduce((peak, point) => Math.max(peak, point.amount), 0);
  const coords = series.map((point, index) => {
    const x = padX + (index * innerW) / Math.max(series.length - 1, 1);
    const ratio = max === 0 ? 0 : point.amount / max;
    const y = padTop + (1 - ratio) * innerH;
    return { x, y };
  });
  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const first = coords[0];
  const last = coords[coords.length - 1];
  const baseline = padTop + innerH;
  const area = first && last ? `${line} L${last.x.toFixed(2)} ${baseline.toFixed(2)} L${first.x.toFixed(2)} ${baseline.toFixed(2)} Z` : '';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full text-ozora-turquoise md:h-56" role="img" aria-label={label}>
      <line x1={padX} y1={padTop} x2={width - padX} y2={padTop} stroke="white" strokeOpacity="0.07" />
      <line x1={padX} y1={padTop + innerH / 2} x2={width - padX} y2={padTop + innerH / 2} stroke="white" strokeOpacity="0.07" />
      <line x1={padX} y1={baseline} x2={width - padX} y2={baseline} stroke="white" strokeOpacity="0.1" />
      <path d={area} fill="currentColor" opacity="0.18" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function EventDashboard({
  model,
  slug,
  when,
  timeZone,
}: {
  model: EventDashboardModel;
  slug: string;
  when: string;
  timeZone: string;
}) {
  const { language } = useLanguage();
  const text = (key: Parameters<typeof adminText>[1]) => adminText(language, key);
  const [copied, setCopied] = useState(false);
  const href = `/events/${encodeURIComponent(slug)}`;
  const quiet = model.series.every((point) => point.amount === 0);
  const firstDay = model.series[0]?.day ?? '';
  const midDay = model.series[Math.floor(model.series.length / 2)]?.day ?? '';
  const lastDay = model.series[model.series.length - 1]?.day ?? '';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-8 space-y-5" role="tabpanel">
      <div className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:flex-row md:items-center md:justify-between md:p-7">
        {when !== '' ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ozora-turquoise/10 text-ozora-turquoise">
              <CalendarDays size={18} aria-hidden="true" />
            </span>
            <p className="truncate font-display text-lg font-bold text-ozora-cream">{when}</p>
          </div>
        ) : (
          <span />
        )}
        <div className="min-w-0 border-t border-white/10 pt-4 md:max-w-lg md:border-l md:border-t-0 md:py-1 md:pl-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/45">{text('eventLink')}</p>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
            <Link2 size={16} className="shrink-0 text-ozora-turquoise" aria-hidden="true" />
            <a href={href} className="min-w-0 flex-1 truncate text-sm font-semibold text-ozora-turquoise transition-colors hover:text-ozora-yellow">
              {href}
            </a>
            <Button type="button" tone="ghost" size="sm" className="shrink-0 border border-white/10" onClick={() => void copyLink()}>
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? text('copiedLink') : text('copyLink')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
          <span className="absolute inset-x-8 top-0 h-px bg-ozora-turquoise/70" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/45">{text('netSales')}</p>
          <p className="mt-5 font-display text-4xl font-bold tabular-nums tracking-[-0.04em] text-ozora-cream sm:text-5xl">{euro(model.netSales, language)}</p>
        </article>
        <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
          <span className="absolute inset-x-8 top-0 h-px bg-ozora-yellow/70" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/45">{text('ticketsSold')}</p>
          <p className="mt-5 font-display text-4xl font-bold tabular-nums tracking-[-0.04em] text-ozora-cream sm:text-5xl">
            {model.sold}
            <span className="ml-1 text-2xl tracking-tight text-ozora-cream/40 sm:text-3xl">/{model.capacity}</span>
          </p>
        </article>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-ozora-cream">{text('salesTrend')}</h2>
          <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/55">{text('last30Days')}</p>
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-ozora-ink/20 px-2 pt-3 sm:px-4">
          <SalesTrend series={model.series} label={text('salesTrend')} />
        </div>
        <div className="mt-3 flex justify-between text-xs font-semibold tabular-nums text-ozora-cream/45">
          <span>{formatDay(firstDay, language)}</span>
          <span>{formatDay(midDay, language)}</span>
          <span>{formatDay(lastDay, language)}</span>
        </div>
        {quiet ? <p className="mt-3 text-sm text-ozora-cream/55">{text('noSales')}</p> : null}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
        <h2 className="font-display text-xl font-bold text-ozora-cream">{text('ticketLadder')}</h2>
        {model.tickets.length === 0 ? <p className="mt-4 text-sm text-ozora-cream/55">{text('noTickets')}</p> : null}
        <div className="mt-3 divide-y divide-white/10">
          {model.tickets.map((ticket) => {
            const width = ticket.capacity === 0 ? 0 : Math.min(100, (ticket.sold / ticket.capacity) * 100);
            const ends = ticket.endsAt ? wallClock(ticket.endsAt, timeZone).date : '';
            return (
              <article key={`${ticket.ticket ?? ''}-${ticket.name}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 py-5 md:grid-cols-[minmax(0,1fr)_8rem_11rem] md:items-center md:gap-6">
                <div className="col-span-2 min-w-0 md:col-span-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-bold text-ozora-cream">{ticket.name}</p>
                    <p className="shrink-0 text-xs font-bold tabular-nums text-ozora-cream/55">
                      {ticket.sold}/{ticket.capacity}
                    </p>
                  </div>
                  {ticket.ticket && ticket.ticket !== ticket.name ? <p className="mt-0.5 text-xs text-ozora-cream/45">{ticket.ticket}</p> : null}
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={ticket.capacity}
                    aria-valuenow={ticket.sold}
                    aria-label={ticket.name}
                  >
                    <div className="h-full rounded-full bg-ozora-turquoise" style={{ width: `${width}%` }} />
                  </div>
                </div>
                <p className="font-display text-lg font-bold tabular-nums text-ozora-cream md:text-right">{euro(ticket.amount, language)}</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass[ticket.status]}`}>
                    {statusText(ticket.status, text)}
                  </span>
                  {ends !== '' ? <p className="w-full text-right text-xs text-ozora-cream/45">{text('loteEnds')} {formatDay(ends, language)}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
        <h2 className="font-display text-xl font-bold text-ozora-cream">{text('recentOrders')}</h2>
        {model.recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-ozora-cream/55">{text('noOrders')}</p>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-ozora-ink/30">
                <tr className="text-xs font-bold uppercase tracking-[0.14em] text-ozora-cream/45">
                  <th className="px-4 py-3.5 font-bold">{text('orderColumn')}</th>
                  <th className="px-4 py-3.5 font-bold">{text('buyerColumn')}</th>
                  <th className="px-4 py-3.5 text-right font-bold">{text('quantityColumn')}</th>
                  <th className="px-4 py-3.5 font-bold">{text('ticketColumn')}</th>
                  <th className="px-4 py-3.5 text-right font-bold">{text('dashboardPrice')}</th>
                  <th className="px-4 py-3.5 font-bold">{text('dashboardDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {model.recentOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="max-w-[12rem] truncate px-4 py-4 font-semibold text-ozora-cream" title={order.id}>
                      {order.id}
                    </td>
                    <td className="px-4 py-4 text-ozora-cream/80">{order.buyer.trim() === '' ? '—' : order.buyer}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-ozora-cream/80">{order.quantity}</td>
                    <td className="px-4 py-4 text-ozora-cream/80">{order.offerName}</td>
                    <td className="px-4 py-4 text-right tabular-nums font-semibold text-ozora-cream">{euro(order.amount, language)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-ozora-cream/70">{orderWhen(order.createdAt, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
