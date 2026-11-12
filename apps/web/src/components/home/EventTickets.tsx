'use client';

import { Ticket } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSignInHref } from '../../account/use-return-path';
import { cheapestOffer } from '../../events/offers';
import type { HomeEvent } from '../../home/types';
import { accountText, eventText, paymentNotice, paymentText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { issueTicketAction, type TicketActionResult } from '../../tickets/actions';
import { Button, TextLink } from '../ui/Button';

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function euroAmount(amount: number, language: string): string {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function EventTickets({ event }: { event: HomeEvent }) {
  const { language } = useLanguage();
  const signInHref = useSignInHref();
  const cheapest = cheapestOffer(event.inAppOffers);
  const [offerName, setOfferName] = useState(cheapest?.name ?? '');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TicketActionResult | null>(null);
  const selected = event.inAppOffers.find((offer) => offer.name === offerName) ?? cheapest;

  if (!selected) {
    return null;
  }

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    if (!selected || pending) {
      return;
    }
    setPending(true);
    const data = new FormData();
    data.set('partyId', event.id);
    data.set('offerName', selected.name);
    setResult(await issueTicketAction(data));
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30">
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
                onChange={() => setOfferName(offer.name)}
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
      <Button
        type="submit"
        disabled={pending}
        className="mt-4 w-full"
        aria-label={fill(eventText(language, 'buyInAppAria'), { title: event.title })}
        icon={<Ticket size={16} aria-hidden="true" />}
      >
        {`${eventText(language, 'buyInApp')} · ${euroAmount(selected.amount, language)}`}
      </Button>
      {result ? (
        <p role="status" className="mt-3 text-sm text-ozora-yellow">
          {paymentNotice(language, result.notice)}
        </p>
      ) : null}
      {result?.notice === 'ticket-ready' && result.ticketId ? (
        <TextLink href={`/my-tickets?ticket=${result.ticketId}`} className="mt-2 text-sm">
          {eventText(language, 'viewTickets')}
        </TextLink>
      ) : null}
      {result?.notice === 'not-signed-in' ? (
        <TextLink href={signInHref} className="mt-2 text-sm">
          {accountText(language, 'signIn')}
        </TextLink>
      ) : null}
      {result?.notice === 'billing-required' ? (
        <TextLink href="/account" className="mt-2 text-sm">
          {paymentText(language, 'billingTitle')}
        </TextLink>
      ) : null}
    </form>
  );
}
