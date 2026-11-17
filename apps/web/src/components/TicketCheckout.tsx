'use client';

import { useState, type FormEvent } from 'react';
import { signInHref } from '../account/return-path';
import { accountText, eventText, paymentNotice, ticketText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { issueTicketAction, type TicketActionResult } from '../tickets/actions';
import { ticketCheckoutPath } from '../tickets/checkout-path';
import { Button, TextLink } from './ui/Button';
import { fieldControlClass } from './ui/field';

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function euroAmount(amount: number, language: string): string {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function euroTotal(amount: number, count: number): number {
  return (Math.round(amount * 100) * count) / 100;
}

export interface TicketBuyer {
  fullName: string;
  email: string;
}

interface OwnerDraft {
  key: string;
  fullName: string;
  email: string;
}

function ownerRows(quantity: number, buyer?: TicketBuyer): OwnerDraft[] {
  const rows: OwnerDraft[] = [];
  for (let index = 0; index < quantity; index += 1) {
    rows.push({
      key: `owner-${index + 1}`,
      fullName: index === 0 ? (buyer?.fullName ?? '') : '',
      email: index === 0 ? (buyer?.email ?? '') : '',
    });
  }
  return rows;
}

export function TicketCheckout({
  eventId,
  title,
  offerName,
  amount,
  quantity,
  buyer,
}: {
  eventId: string;
  title: string;
  offerName: string;
  amount: number;
  quantity: number;
  buyer?: TicketBuyer;
}) {
  const { language } = useLanguage();
  const [owners, setOwners] = useState<OwnerDraft[]>(() => ownerRows(quantity, buyer));
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TicketActionResult | null>(null);
  const total = euroTotal(amount, quantity);
  const eventHref = `/events/${encodeURIComponent(eventId)}`;

  function updateOwner(key: string, field: 'fullName' | 'email', value: string): void {
    setOwners((current) => current.map((owner) => (owner.key === key ? { ...owner, [field]: value } : owner)));
  }

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    if (pending) {
      return;
    }
    setPending(true);
    const data = new FormData();
    data.set('partyId', eventId);
    data.set('offerName', offerName);
    for (const owner of owners) {
      data.append('ownerName', owner.fullName);
      data.append('ownerEmail', owner.email);
    }
    setResult(await issueTicketAction(data));
    setPending(false);
  }

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-xl">
        <Button href={eventHref} tone="back" size="sm">
          {title}
        </Button>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-ozora-yellow">{eventText(language, 'checkout')}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ozora-cream">{title}</h1>
        <p className="mt-3 text-sm font-bold text-ozora-cream">{fill(eventText(language, 'orderLine'), { count: String(quantity), name: offerName })}</p>
        <form onSubmit={onSubmit} className="mt-8">
          <h2 className="text-lg font-bold text-ozora-cream">{eventText(language, 'holdersTitle')}</h2>
          <div className="mt-4 space-y-3">
            {owners.map((owner, index) => {
              const nameId = `${owner.key}-name`;
              const emailId = `${owner.key}-email`;
              return (
                <fieldset key={owner.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <legend className="px-1 text-xs font-bold uppercase tracking-wide text-ozora-cream/70">
                    {fill(eventText(language, 'ownerHeading'), { number: String(index + 1) })}
                  </legend>
                  <label htmlFor={nameId} className="mt-2 block text-xs font-bold text-ozora-cream/70">
                    {eventText(language, 'ownerName')}
                  </label>
                  <input
                    id={nameId}
                    name="ownerName"
                    value={owner.fullName}
                    onChange={(change) => updateOwner(owner.key, 'fullName', change.target.value)}
                    autoComplete={index === 0 ? 'name' : 'off'}
                    required
                    maxLength={80}
                    className={`${fieldControlClass} mt-1`}
                  />
                  <label htmlFor={emailId} className="mt-3 block text-xs font-bold text-ozora-cream/70">
                    {eventText(language, 'ownerEmail')}
                  </label>
                  <input
                    id={emailId}
                    name="ownerEmail"
                    type="email"
                    value={owner.email}
                    onChange={(change) => updateOwner(owner.key, 'email', change.target.value)}
                    autoComplete={index === 0 ? 'email' : 'off'}
                    required
                    maxLength={160}
                    className={`${fieldControlClass} mt-1`}
                  />
                </fieldset>
              );
            })}
          </div>
          <h2 className="mt-8 text-lg font-bold text-ozora-cream">{eventText(language, 'paymentTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ozora-cream/70">{eventText(language, 'inAppNote')}</p>
          <p className="mt-4 text-sm font-bold text-ozora-cream">{euroAmount(total, language)}</p>
          <Button type="submit" disabled={pending} className="mt-4 w-full">
            {`${eventText(language, 'pay')} · ${euroAmount(total, language)}`}
          </Button>
          {result ? (
            <p role="status" className="mt-3 text-sm text-ozora-yellow">
              {paymentNotice(language, result.notice)}
            </p>
          ) : null}
          {result?.unsent && result.unsent.length > 0 ? (
            <p role="status" className="mt-2 text-sm text-ozora-yellow">
              {ticketText(language, 'mailMissed').replaceAll('{emails}', result.unsent.join(', '))}
            </p>
          ) : null}
          {result?.notice === 'ticket-ready' && result.ticketId ? (
            <TextLink href={`/my-tickets?ticket=${result.ticketId}`} className="mt-2 text-sm">
              {eventText(language, 'viewTickets')}
            </TextLink>
          ) : null}
          {result?.notice === 'not-signed-in' ? (
            <TextLink href={signInHref(ticketCheckoutPath(eventId, offerName, quantity))} className="mt-2 text-sm">
              {accountText(language, 'signIn')}
            </TextLink>
          ) : null}
        </form>
      </div>
    </section>
  );
}
