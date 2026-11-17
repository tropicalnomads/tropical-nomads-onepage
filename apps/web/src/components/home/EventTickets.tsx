'use client';

import { Minus, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import { ticketOwnerLimit } from 'tropical-nomads-shared';
import { cheapestOffer } from '../../events/offers';
import type { HomeEvent } from '../../home/types';
import { eventText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { ticketCheckoutPath } from '../../tickets/checkout-path';
import { Button, IconButton } from '../ui/Button';

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function euroAmount(amount: number, language: string): string {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function euroTotal(amount: number, count: number): number {
  return (Math.round(amount * 100) * count) / 100;
}

function fitCount(length: number, nextCap: number): number {
  if (nextCap < 1) {
    return 1;
  }
  return Math.min(Math.max(length, 1), nextCap);
}

export function EventTickets({ event }: { event: HomeEvent }) {
  const { language } = useLanguage();
  const cheapest = cheapestOffer(event.inAppOffers);
  const [offerName, setOfferName] = useState(cheapest?.name ?? '');
  const [quantity, setQuantity] = useState(1);
  const selected = event.inAppOffers.find((offer) => offer.name === offerName) ?? cheapest;
  const cap = selected ? Math.min(ticketOwnerLimit, selected.remaining) : 0;
  const canBuy = selected !== undefined && cap >= 1 && quantity >= 1 && quantity <= cap;

  function changeQuantity(next: number): void {
    if (next < 1 || next > cap) {
      return;
    }
    setQuantity(next);
  }

  function selectOffer(name: string): void {
    const offer = event.inAppOffers.find((item) => item.name === name);
    const nextCap = offer ? Math.min(ticketOwnerLimit, offer.remaining) : 0;
    setOfferName(name);
    setQuantity((current) => fitCount(current, nextCap));
  }

  if (!selected) {
    return null;
  }

  const total = euroTotal(selected.amount, quantity);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30">
      <h2 className="font-display text-2xl font-bold text-ozora-cream">{eventText(language, 'ticketsTitle')}</h2>
      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">{eventText(language, 'ticketsTitle')}</legend>
        {event.inAppOffers.map((offer) => {
          const active = offer.name === selected.name;
          return (
            <label
              key={offer.name}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-ozora-yellow ${
                active ? 'border-ozora-yellow bg-ozora-yellow/15' : 'border-white/15 bg-black/20 hover:border-white/30'
              }`}
            >
              <input
                type="radio"
                name="offerName"
                value={offer.name}
                checked={active}
                onChange={() => selectOffer(offer.name)}
                className="sr-only"
              />
              <span className="min-w-0">
                <span className={`block truncate text-sm font-bold ${active ? 'text-ozora-yellow' : 'text-ozora-cream'}`}>{offer.name}</span>
                <span className="mt-0.5 block text-xs text-ozora-cream/60">
                  {fill(eventText(language, 'capacityLabel'), { count: String(offer.remaining) })}
                </span>
              </span>
              <span className={`shrink-0 text-sm font-bold ${active ? 'text-ozora-yellow' : 'text-ozora-cream'}`}>
                {euroAmount(offer.amount, language)}
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="mt-4 flex items-center justify-between gap-3" role="group" aria-label={eventText(language, 'quantityLabel')}>
        <span className="text-sm font-bold text-ozora-cream">{eventText(language, 'quantityLabel')}</span>
        <div className="flex items-center gap-2">
          <IconButton label={eventText(language, 'decreaseQuantity')} onClick={() => changeQuantity(quantity - 1)} disabled={quantity <= 1}>
            <Minus size={16} aria-hidden="true" />
          </IconButton>
          <span aria-live="polite" className="min-w-8 text-center text-sm font-bold text-ozora-cream">
            {quantity}
          </span>
          <IconButton label={eventText(language, 'increaseQuantity')} onClick={() => changeQuantity(quantity + 1)} disabled={quantity >= cap}>
            <Plus size={16} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
      <p className="mt-4 text-sm font-bold text-ozora-cream">{fill(eventText(language, 'orderLine'), { count: String(quantity), name: selected.name })}</p>
      <Button
        href={ticketCheckoutPath(event.id, selected.name, quantity)}
        disabled={!canBuy}
        className="mt-4 w-full"
        aria-label={fill(eventText(language, 'checkoutAria'), { title: event.title })}
        icon={<Ticket size={16} aria-hidden="true" />}
      >
        {`${eventText(language, 'checkout')} · ${euroAmount(total, language)}`}
      </Button>
    </div>
  );
}
