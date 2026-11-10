'use client';

import { useState, type FormEvent } from 'react';
import { savePartyAction, type PartyFormResult } from '../admin/actions';
import type { AdminEventValues, AdminOfferField } from '../admin/values';
import { adminText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

const fieldClass = 'w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-ozora-cream';

function blankOffer(): AdminOfferField {
  return { name: '', amount: '', capacity: '' };
}

export function AdminEventForm({ values }: { values: AdminEventValues }) {
  const { language } = useLanguage();
  const [offers, setOffers] = useState<AdminOfferField[]>(values.offers.length > 0 ? values.offers : [blankOffer()]);
  const [result, setResult] = useState<PartyFormResult | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    const intent = submitter instanceof HTMLButtonElement ? submitter.value : 'save';
    const form = new FormData(event.currentTarget);
    form.set('intent', intent);
    const saved = await savePartyAction(form);
    setResult(saved);
    setPending(false);
    if (saved.notice === 'saved' && saved.id) {
      window.location.assign(`/admin/events/${saved.id}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <label className="block text-sm text-ozora-cream">
        {adminText(language, 'titleLabel')}
        <input name="title" required defaultValue={values.title} className={fieldClass} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-ozora-cream">
          {adminText(language, 'start')}
          <input name="dateStart" required defaultValue={values.dateStart} placeholder="2026-12-01T22:00:00Z" className={fieldClass} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {adminText(language, 'end')}
          <input name="dateEnd" defaultValue={values.dateEnd} className={fieldClass} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {adminText(language, 'timezone')}
          <input name="timezone" defaultValue={values.timezone} placeholder="Europe/Lisbon" className={fieldClass} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {adminText(language, 'venue')}
          <input name="venueName" required defaultValue={values.venueName} className={fieldClass} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {adminText(language, 'city')}
          <input name="venueCity" defaultValue={values.venueCity} className={fieldClass} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {adminText(language, 'image')}
          <input name="imageUrl" defaultValue={values.imageUrl} placeholder="https://" className={fieldClass} />
        </label>
      </div>
      <label className="block text-sm text-ozora-cream">
        {adminText(language, 'description')}
        <textarea name="description" defaultValue={values.description} rows={4} className={fieldClass} />
      </label>
      <label className="block text-sm text-ozora-cream">
        {adminText(language, 'artists')}
        <textarea name="artists" defaultValue={values.artists} rows={3} className={fieldClass} />
      </label>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ozora-cream">{adminText(language, 'offers')}</legend>
        {offers.map((offer, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-3">
            <input name="offerName" defaultValue={offer.name} placeholder={adminText(language, 'offerName')} aria-label={adminText(language, 'offerName')} className={fieldClass} />
            <input name="offerAmount" defaultValue={offer.amount} placeholder={adminText(language, 'price')} aria-label={adminText(language, 'price')} inputMode="decimal" className={fieldClass} />
            <input name="offerCapacity" defaultValue={offer.capacity} placeholder={adminText(language, 'capacity')} aria-label={adminText(language, 'capacity')} inputMode="numeric" className={fieldClass} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOffers((current) => [...current, blankOffer()])}
          className="rounded-lg border border-ozora-turquoise/70 px-4 py-2 text-sm font-semibold text-ozora-cream"
        >
          {adminText(language, 'addOffer')}
        </button>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="save" disabled={pending} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-ozora-cream">
          {adminText(language, 'save')}
        </button>
        <button type="submit" name="intent" value="publish" disabled={pending} className="rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink">
          {adminText(language, 'publish')}
        </button>
      </div>
      {result && result.notice !== 'saved' ? (
        <p role="status" className="text-sm text-ozora-yellow">
          {adminText(language, result.notice === 'denied' ? 'deniedBody' : 'invalid')}
        </p>
      ) : null}
    </form>
  );
}
