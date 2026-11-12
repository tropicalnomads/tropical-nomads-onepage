'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { saveVenueAction } from '../../admin/venue-actions';
import { adminText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { countryChoices, countryCodeFromInput } from '../../shop/postal';
import type { VenueChoice } from '../../venues/load';
import { Button, TextLink } from '../ui/Button';
import { SelectField } from '../ui/Select';
import { adminFieldClass } from './form';

export function VenueEditor({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (venue: VenueChoice) => void }) {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const text = (key: Parameters<typeof adminText>[1]) => adminText(language, key);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName('');
    setCity('');
    setCountry('');
    setAddress('');
    setMapUrl('');
    setError('');
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    setPending(true);
    setError('');
    const data = new FormData();
    data.set('name', name);
    data.set('city', city);
    data.set('country', country);
    data.set('isoCountry', countryCodeFromInput(country) ?? '');
    data.set('address', address);
    data.set('mapUrl', mapUrl);
    const saved = await saveVenueAction(data);
    setPending(false);
    if (saved.notice !== 'saved') {
      setError(text('venueInvalid'));
      return;
    }
    const venue = saved.venue;
    onSaved({
      id: venue.id,
      name: venue.name ?? name.trim(),
      city: venue.city ?? city.trim(),
      country: venue.country ?? country.trim(),
      ...(venue.address ? { address: venue.address } : {}),
      ...(venue.mapUrl ? { mapUrl: venue.mapUrl } : {}),
    });
    onClose();
  }

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (document.querySelector(':popover-open')) {
          return;
        }
        onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(94vw,36rem)] overflow-y-auto rounded-[2rem] border border-white/15 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
    >
      <form onSubmit={onSubmit} className="space-y-4 p-5 md:p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">{text('venueProfile')}</h2>
          <TextLink onClick={onClose}>{text('cancel')}</TextLink>
        </div>
        <label className="block text-sm font-bold">
          {text('venue')}
          <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={`${adminFieldClass} mt-2`} />
        </label>
        <label className="block text-sm font-bold">
          {text('city')}
          <input required maxLength={80} value={city} onChange={(event) => setCity(event.target.value)} className={`${adminFieldClass} mt-2`} />
        </label>
        <label className="block text-sm font-bold">
          {text('country')}
          <div className="mt-2">
            <SelectField
              ariaLabel={text('country')}
              value={country}
              placeholder={text('country')}
              searchable
              searchPlaceholder={text('searchCountry')}
              emptyLabel={text('noCountry')}
              onChange={setCountry}
              options={countryChoices(language)}
            />
          </div>
        </label>
        <label className="block text-sm font-bold">
          {text('venueAddress')}
          <input maxLength={240} value={address} onChange={(event) => setAddress(event.target.value)} className={`${adminFieldClass} mt-2`} />
        </label>
        <label className="block text-sm font-bold">
          {text('venueMap')}
          <input value={mapUrl} onChange={(event) => setMapUrl(event.target.value)} placeholder="https://maps.app.goo.gl/" className={`${adminFieldClass} mt-2`} />
        </label>
        {error ? <p className="text-sm font-semibold text-ozora-coral">{error}</p> : null}
        <Button type="submit" disabled={pending || country.trim() === ''}>
          {pending ? text('saving') : text('saveVenue')}
        </Button>
      </form>
    </dialog>,
    document.body,
  );
}
