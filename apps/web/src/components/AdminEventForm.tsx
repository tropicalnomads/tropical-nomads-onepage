'use client';

import { CalendarDays, MapPin, Music2, Plus, Star, Ticket } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { loteOffers, loteStatuses, type LoteOffer, type LoteStatus } from 'tropical-nomads-shared';
import { savePartyAction, type PartyFormResult } from '../admin/actions';
import type { EventPhase } from '../admin/event-board';
import { instantFromWall, wallClock } from '../admin/event-time';
import { followingMorning, timezoneForCity, venueIdFor } from '../admin/place-time';
import { timeZoneChoices } from '../admin/time-zones';
import type { AdminEventValues } from '../admin/values';
import { displayedCountryFlag } from '../artists/flag';
import { lineupArtists, type ArtistProfile } from '../artists/profile';
import { normalizeSearch } from '../events/calendar';
import { adminText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { eventCropSize } from '../shop/crop-image';
import type { VenueChoice } from '../venues/load';
import { ArtistEditor } from './admin/ArtistEditor';
import { CroppedImageField } from './admin/CroppedImageField';
import { AdminSection, adminFieldClass } from './admin/form';
import { MarkdownField } from './admin/MarkdownField';
import { VenueEditor } from './admin/VenueEditor';
import { CountryMark } from './ui/CountryMark';
import { Button, TextLink } from './ui/Button';
import { SelectField } from './ui/Select';

interface LoteDraft {
  name: string;
  amount: string;
  capacity: string;
  endsOn: string;
}

interface TypeDraft {
  name: string;
  lotes: LoteDraft[];
}

interface LineupEntry {
  name: string;
  artistId?: string;
  headliner?: boolean;
}

function blankLote(): LoteDraft {
  return { name: '', amount: '', capacity: '', endsOn: '' };
}

function typesFrom(values: AdminEventValues): TypeDraft[] {
  const zone = values.timezone;
  const types: TypeDraft[] = [];
  for (const offer of values.offers) {
    const typeName = offer.ticket.trim() || offer.name;
    const lote = {
      name: offer.name,
      amount: offer.amount,
      capacity: offer.capacity,
      endsOn: offer.endsAt ? wallClock(offer.endsAt, zone).date : '',
    };
    const current = types[types.length - 1];
    if (current && current.name === typeName && typeName !== '') {
      current.lotes.push(lote);
      continue;
    }
    types.push({ name: typeName, lotes: [lote] });
  }
  return types.length > 0 ? types : [{ name: '', lotes: [blankLote()] }];
}

function catalogFrom(types: readonly TypeDraft[], timeZone: string): LoteOffer[] {
  const offers: LoteOffer[] = [];
  for (const type of types) {
    for (const lote of type.lotes) {
      const amount = Number(lote.amount);
      const capacity = Number(lote.capacity);
      if (lote.name.trim() === '' || !Number.isInteger(capacity) || capacity < 1) {
        continue;
      }
      const endsAt = lote.endsOn ? instantFromWall(lote.endsOn, '23:59', timeZone) : '';
      offers.push({
        name: lote.name.trim(),
        amount,
        currency: 'EUR',
        capacity,
        ...(type.name.trim() ? { ticket: type.name.trim() } : {}),
        ...(endsAt ? { endsAt } : {}),
      });
    }
  }
  return loteOffers(offers);
}

function statusLabel(status: LoteStatus, label: (key: 'onSale' | 'scheduled' | 'soldOut' | 'loteEnded') => string): string {
  switch (status) {
    case 'on-sale':
      return label('onSale');
    case 'scheduled':
      return label('scheduled');
    case 'sold-out':
      return label('soldOut');
    case 'ended':
      return label('loteEnded');
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
}

function alreadyPublished(phase: EventPhase): boolean {
  switch (phase) {
    case 'draft':
      return false;
    case 'published':
    case 'ended':
      return true;
    default: {
      const unexpected: never = phase;
      return unexpected;
    }
  }
}

const phaseClass: Record<EventPhase, string> = {
  draft: 'border-ozora-yellow/20 bg-ozora-yellow/[0.07] text-ozora-yellow',
  published: 'border-ozora-turquoise/20 bg-ozora-turquoise/[0.07] text-ozora-turquoise',
  ended: 'border-white/10 bg-white/[0.04] text-ozora-cream/55',
};

export function AdminEventForm({
  values,
  artists,
  venues,
  sold,
  phase,
}: {
  values: AdminEventValues;
  artists: ArtistProfile[];
  venues: VenueChoice[];
  sold: Record<string, number>;
  phase: EventPhase;
}) {
  const { language } = useLanguage();
  const zones = timeZoneChoices();
  const knownZone = zones.includes(values.timezone) ? values.timezone : '';
  const matchedVenueId = venueIdFor(venues, { id: values.venueId, name: values.venueName, city: values.venueCity });
  const matchedCity = venues.find((place) => place.id === matchedVenueId)?.city || values.venueCity;
  const start = wallClock(values.dateStart, knownZone);
  const end = wallClock(values.dateEnd, knownZone);
  const [tab, setTab] = useState<'details' | 'tickets'>('details');
  const [title, setTitle] = useState(values.title);
  const [description, setDescription] = useState(values.description);
  const [timezone, setTimezone] = useState(knownZone || timezoneForCity(matchedCity) || '');
  const [startDate, setStartDate] = useState(start.date);
  const [startTime, setStartTime] = useState(start.time);
  const [endDate, setEndDate] = useState(end.date);
  const [endTime, setEndTime] = useState(end.time);
  const [places, setPlaces] = useState(venues);
  const [venueId, setVenueId] = useState(matchedVenueId);
  const [venueOpen, setVenueOpen] = useState(false);
  const [lineup, setLineup] = useState<LineupEntry[]>(() => {
    const entries = lineupArtists(
      values.artists.split('\n').map((name) => name.trim()).filter((name) => name !== ''),
      artists,
    );
    const title = normalizeSearch(values.title);
    const headliners =
      values.headliners ?? entries.filter((entry) => title.includes(normalizeSearch(entry.name))).map((entry) => entry.name);
    return entries.map((entry) => ({
      ...entry,
      ...(headliners.some((name) => name.toLowerCase() === entry.name.toLowerCase()) ? { headliner: true } : {}),
    }));
  });
  const [catalog, setCatalog] = useState(artists);
  const [query, setQuery] = useState('');
  const [draftName, setDraftName] = useState('');
  const [types, setTypes] = useState<TypeDraft[]>(() => typesFrom(values));
  const [preview, setPreview] = useState<string | undefined>(values.imageUrl || undefined);
  const [imageFile, setImageFile] = useState<File>();
  const [imageRemoved, setImageRemoved] = useState(false);
  const [editing, setEditing] = useState<ArtistProfile | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [result, setResult] = useState<PartyFormResult | null>(null);
  const [pending, setPending] = useState(false);
  const text = (key: Parameters<typeof adminText>[1]) => adminText(language, key);
  const statuses = useMemo(() => loteStatuses(catalogFrom(types, timezone), sold, new Date()), [sold, timezone, types]);

  const matches = catalog
    .filter((artist) => artist.name.toLowerCase().includes(query.trim().toLowerCase()) && query.trim() !== '')
    .filter((artist) => !lineup.some((entry) => entry.artistId === artist.id))
    .slice(0, 6);

  function addArtist(artist: ArtistProfile): void {
    setLineup((current) => (current.some((entry) => entry.artistId === artist.id) ? current : [...current, { name: artist.name, artistId: artist.id }]));
    setQuery('');
  }

  function addName(): void {
    const name = draftName.trim();
    if (name === '' || lineup.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    const known = catalog.find((artist) => artist.name.toLowerCase() === name.toLowerCase());
    setLineup((current) => [...current, known ? { name: known.name, artistId: known.id } : { name }]);
    setDraftName('');
  }

  function chooseVenue(id: string, city?: string): void {
    setVenueId(id);
    const placeCity = city ?? places.find((place) => place.id === id)?.city ?? '';
    const zone = timezoneForCity(placeCity);
    if (zone) {
      setTimezone(zone);
    }
  }

  function chooseStartDate(value: string): void {
    setStartDate(value);
    const morning = followingMorning(value);
    if (!morning) {
      return;
    }
    setEndDate(morning.date);
    setEndTime(morning.time);
  }

  function updateType(index: number, next: TypeDraft): void {
    setTypes((current) => current.map((type, typeIndex) => (typeIndex === index ? next : type)));
  }

  function moveLote(typeIndex: number, loteIndex: number, direction: -1 | 1): void {
    setTypes((current) =>
      current.map((type, index) => {
        if (index !== typeIndex) {
          return type;
        }
        const target = loteIndex + direction;
        if (target < 0 || target >= type.lotes.length) {
          return type;
        }
        const lotes = type.lotes.slice();
        const [item] = lotes.splice(loteIndex, 1);
        if (!item) {
          return type;
        }
        lotes.splice(target, 0, item);
        return { ...type, lotes };
      }),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    const intent = submitter instanceof HTMLButtonElement ? submitter.value : 'save';
    const data = new FormData();
    if (values.id) {
      data.set('id', values.id);
    }
    data.set('title', title);
    data.set('description', description);
    if (timezone === '' || venueId === '') {
      setResult({ notice: 'invalid' });
      return;
    }
    data.set('timezone', timezone);
    data.set('venueId', venueId);
    data.set('dateStart', instantFromWall(startDate, startTime, timezone));
    data.set('dateEnd', endDate === '' ? '' : instantFromWall(endDate, endTime === '' ? '00:00' : endTime, timezone));
    data.set('artists', lineup.map((entry) => entry.name).join('\n'));
    data.set('headliners', lineup.filter((entry) => entry.headliner).map((entry) => entry.name).join('\n'));
    data.set('intent', intent);
    data.set('imageAction', imageRemoved ? 'remove' : 'keep');
    if (imageFile) {
      data.set('image', imageFile);
    }
    for (const type of types) {
      for (const lote of type.lotes) {
        data.append('offerName', lote.name);
        data.append('offerAmount', lote.amount);
        data.append('offerCapacity', lote.capacity);
        data.append('offerTicket', type.name);
        data.append('offerEnds', lote.endsOn === '' ? '' : instantFromWall(lote.endsOn, '23:59', timezone));
      }
    }
    setPending(true);
    const saved = await savePartyAction(data);
    setResult(saved);
    setPending(false);
    if (saved.notice === 'saved' && saved.id && saved.id !== values.id) {
      window.location.assign(`/admin/events/${saved.id}`);
    }
  }

  const priced = catalogFrom(types, timezone);
  const selectedVenue = places.find((place) => place.id === venueId);
  const zoneOptions = zones.map((zone) => ({ value: zone, label: zone }));
  const venueOptions = places.map((place) => ({ value: place.id, label: `${place.name}, ${place.city}` }));

  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <form onSubmit={onSubmit} className="mx-auto max-w-6xl">
        <Button href="/admin/events" tone="back" size="sm">
          {text('back')}
        </Button>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ozora-cream md:text-4xl">
            {title.trim() || text(values.id ? 'editEvent' : 'newEvent')}
          </h1>
          <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${phaseClass[phase]}`}>
            {text(phase)}
          </span>
        </div>

        <div className="mt-6 flex gap-2" role="tablist">
          <Button type="button" role="tab" aria-selected={tab === 'details'} tone={tab === 'details' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('details')}>
            {text('detailsTab')}
          </Button>
          <Button type="button" role="tab" aria-selected={tab === 'tickets'} tone={tab === 'tickets' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('tickets')}>
            {text('ticketsTab')}
          </Button>
        </div>

        {tab === 'details' ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(18rem,23rem)_minmax(0,1fr)] lg:items-start">
            <CroppedImageField
              preview={preview}
              aspect={3 / 4}
              aspectClass="aspect-[3/4]"
              output={eventCropSize}
              fileName="flyer.webp"
              labels={{
                title: text('flyer'),
                ratio: text('flyerRatio'),
                remove: text('removeImage'),
                noImage: text('noImage'),
                placeholder: text('imagePlaceholder'),
                replace: text('replaceImage'),
                upload: text('uploadImage'),
                help: text('imageHelp'),
                invalid: text('imageInvalid'),
                cropTitle: text('cropImage'),
                cropHelp: text('cropHelp'),
                cancel: text('cancel'),
                zoom: text('zoom'),
                cropping: text('croppingImage'),
                use: text('useImage'),
              }}
              onChange={(next) => {
                setPreview(next.preview);
                setImageFile(next.file);
                setImageRemoved(next.removed);
              }}
            />
            <div className="space-y-6">
              <AdminSection icon={<CalendarDays size={20} aria-hidden="true" />} title={text('eventDetails')} help={text('detailsHelp')}>
                <label className="block text-sm font-bold">
                  {text('titleLabel')}
                  <input required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} className={`${adminFieldClass} mt-2`} />
                </label>
                <MarkdownField
                  id="event-description"
                  name="description"
                  value={description}
                  maxLength={4000}
                  rows={7}
                  label={text('description')}
                  boldLabel={text('boldText')}
                  italicLabel={text('italicText')}
                  help={text('markdownHelp')}
                  previewLabel={text('preview')}
                  onChange={setDescription}
                />
              </AdminSection>
              <AdminSection icon={<MapPin size={20} aria-hidden="true" />} title={text('place')}>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block min-w-0 flex-1 text-sm font-bold">
                    {text('venue')}
                    <div className="mt-2">
                      <SelectField
                        ariaLabel={text('venue')}
                        value={venueId}
                        placeholder={text('chooseVenue')}
                        searchable
                        searchPlaceholder={text('searchVenue')}
                        emptyLabel={text('noVenue')}
                        onChange={chooseVenue}
                        options={venueOptions}
                      />
                    </div>
                  </label>
                  <Button type="button" tone="ghost" className="shrink-0" onClick={() => setVenueOpen(true)}>
                    {text('addVenue')}
                  </Button>
                </div>
                {selectedVenue ? (
                  <p className="text-sm text-ozora-cream/80">
                    <span className="font-bold text-ozora-cream">{text('city')}</span> {selectedVenue.city}
                  </p>
                ) : values.venueName ? (
                  <p className="text-sm text-ozora-cream/55">{[values.venueName, values.venueCity].filter((part) => part !== '').join(', ')}</p>
                ) : null}
              </AdminSection>
              <AdminSection icon={<CalendarDays size={20} aria-hidden="true" />} title={text('when')}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold">
                    {text('date')}
                    <input required type="date" value={startDate} onChange={(event) => chooseStartDate(event.target.value)} className={`${adminFieldClass} mt-2`} />
                  </label>
                  <label className="block text-sm font-bold">
                    {text('time')}
                    <input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={`${adminFieldClass} mt-2`} />
                  </label>
                  <label className="block text-sm font-bold">
                    {text('end')}
                    <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${adminFieldClass} mt-2`} />
                  </label>
                  <label className="block text-sm font-bold">
                    {text('time')}
                    <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={`${adminFieldClass} mt-2`} />
                  </label>
                </div>
                <label className="block text-sm font-bold">
                  {text('timezone')}
                  <div className="mt-2">
                    <SelectField
                      ariaLabel={text('timezone')}
                      value={timezone}
                      placeholder={text('chooseTimezone')}
                      searchable
                      searchPlaceholder={text('searchTimezone')}
                      emptyLabel={text('noTimezone')}
                      onChange={setTimezone}
                      options={zoneOptions}
                    />
                  </div>
                </label>
              </AdminSection>
              <AdminSection icon={<Music2 size={20} aria-hidden="true" />} title={text('lineup')} help={text('lineupHelp')}>
                <label className="block text-sm font-bold">
                  {text('lineupSearch')}
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${adminFieldClass} mt-2`} />
                </label>
                {query.trim() !== '' && matches.length === 0 ? <p className="text-sm text-ozora-cream/55">{text('noArtists')}</p> : null}
                <div className="space-y-2">
                  {matches.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => addArtist(artist)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left hover:border-ozora-turquoise/50"
                    >
                      <ArtistFace artist={artist} />
                      <span className="min-w-0">
                        <span className="block font-bold">{artist.name}</span>
                        <CountryMark flag={displayedCountryFlag(artist.isoCountry, artist.flag)} className="text-xs text-ozora-cream/55" />
                      </span>
                    </button>
                  ))}
                </div>
                {lineup.length === 0 ? <p className="text-sm text-ozora-cream/55">{text('lineupEmpty')}</p> : null}
                <div className="space-y-3">
                  {lineup.map((entry) => {
                    const artist = catalog.find((item) => item.id === entry.artistId);
                    return (
                      <article key={`${entry.artistId ?? 'name'}-${entry.name}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                        <button
                          type="button"
                          aria-pressed={entry.headliner === true}
                          aria-label={(entry.headliner ? text('clearHeadliner') : text('markHeadliner')).replaceAll('{name}', entry.name)}
                          onClick={() => setLineup((current) => current.map((item) => (item === entry ? { ...item, headliner: item.headliner !== true } : item)))}
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${entry.headliner ? 'bg-ozora-yellow/15 text-ozora-yellow' : 'text-ozora-cream/40 hover:text-ozora-yellow'}`}
                        >
                          <Star size={16} fill={entry.headliner ? 'currentColor' : 'none'} aria-hidden="true" />
                        </button>
                        <ArtistFace artist={artist} />
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          {entry.artistId ? (
                            <a href={`/artists/${entry.artistId}`} className="min-w-0 truncate font-bold text-ozora-cream hover:text-ozora-yellow">
                              {entry.name}
                            </a>
                          ) : (
                            <p className="min-w-0 truncate font-bold">{entry.name}</p>
                          )}
                          <CountryMark
                            flag={displayedCountryFlag(artist?.isoCountry, artist?.flag)}
                            className="shrink-0 text-xs text-ozora-cream/55"
                            flagClassName="h-2.5 w-3.5 shrink-0 rounded-[2px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(artist ?? { id: '', name: entry.name, country: '', genres: [], bio: '', soundcloud: '', instagram: '', website: '' });
                            setEditorOpen(true);
                          }}
                          className="text-xs font-bold text-ozora-turquoise"
                        >
                          {text('editArtist')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLineup((current) => current.filter((item) => item !== entry))}
                          className="text-xs font-bold text-ozora-coral"
                        >
                          {text('removeLote')}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder={text('addName')} className={adminFieldClass} />
                  <Button type="button" tone="ghost" className="shrink-0" onClick={addName}>
                    {text('addName')}
                  </Button>
                </div>
              </AdminSection>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <AdminSection icon={<Ticket size={20} aria-hidden="true" />} title={text('ticketLadder')} help={text('ticketHelp')}>
              {types.map((type, typeIndex) => (
                <fieldset key={`type-${typeIndex}`} className="space-y-3 rounded-2xl border border-white/10 p-4">
                  <label className="block text-sm font-bold">
                    {text('typeName')}
                    <input
                      value={type.name}
                      onChange={(event) => updateType(typeIndex, { ...type, name: event.target.value })}
                      className={`${adminFieldClass} mt-2`}
                    />
                  </label>
                  {type.lotes.map((lote, loteIndex) => {
                    const known = priced.findIndex((item) => item.name === lote.name.trim());
                    const status = known >= 0 ? statuses[known] : undefined;
                    return (
                      <div key={`lote-${typeIndex}-${loteIndex}`} className="grid gap-3 rounded-2xl bg-black/20 p-3 md:grid-cols-[1fr_8rem_8rem_10rem_auto]">
                        <label className="block text-xs font-bold">
                          {text('loteName')}
                          <input value={lote.name} onChange={(event) => {
                            const lotes = type.lotes.slice();
                            const current = lotes[loteIndex];
                            if (!current) return;
                            lotes[loteIndex] = { ...current, name: event.target.value };
                            updateType(typeIndex, { ...type, lotes });
                          }} className={`${adminFieldClass} mt-2`} />
                        </label>
                        <label className="block text-xs font-bold">
                          {text('price')}
                          <input value={lote.amount} onChange={(event) => {
                            const lotes = type.lotes.slice();
                            const current = lotes[loteIndex];
                            if (!current) return;
                            lotes[loteIndex] = { ...current, amount: event.target.value };
                            updateType(typeIndex, { ...type, lotes });
                          }} inputMode="decimal" className={`${adminFieldClass} mt-2`} />
                        </label>
                        <label className="block text-xs font-bold">
                          {text('capacity')}
                          <input value={lote.capacity} onChange={(event) => {
                            const lotes = type.lotes.slice();
                            const current = lotes[loteIndex];
                            if (!current) return;
                            lotes[loteIndex] = { ...current, capacity: event.target.value };
                            updateType(typeIndex, { ...type, lotes });
                          }} inputMode="numeric" className={`${adminFieldClass} mt-2`} />
                        </label>
                        <label className="block text-xs font-bold">
                          {text('loteEnds')}
                          <input type="date" value={lote.endsOn} onChange={(event) => {
                            const lotes = type.lotes.slice();
                            const current = lotes[loteIndex];
                            if (!current) return;
                            lotes[loteIndex] = { ...current, endsOn: event.target.value };
                            updateType(typeIndex, { ...type, lotes });
                          }} className={`${adminFieldClass} mt-2`} />
                        </label>
                        <div className="flex flex-wrap items-end gap-2">
                          {status ? <span className="rounded-full border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase">{statusLabel(status, text)}</span> : null}
                          <button type="button" onClick={() => moveLote(typeIndex, loteIndex, -1)} className="text-xs font-bold text-ozora-cream/70">{text('moveUp')}</button>
                          <button type="button" onClick={() => moveLote(typeIndex, loteIndex, 1)} className="text-xs font-bold text-ozora-cream/70">{text('moveDown')}</button>
                          <button type="button" onClick={() => updateType(typeIndex, { ...type, lotes: type.lotes.filter((_item, index) => index !== loteIndex) })} className="text-xs font-bold text-ozora-coral">{text('removeLote')}</button>
                        </div>
                      </div>
                    );
                  })}
                  <TextLink onClick={() => updateType(typeIndex, { ...type, lotes: [...type.lotes, blankLote()] })} className="inline-flex items-center gap-2 text-sm">
                    <Plus size={16} aria-hidden="true" />
                    {text('addLote')}
                  </TextLink>
                </fieldset>
              ))}
              <TextLink onClick={() => setTypes((current) => [...current, { name: '', lotes: [blankLote()] }])} className="inline-flex items-center gap-2 text-sm">
                <Plus size={16} aria-hidden="true" />
                {text('addType')}
              </TextLink>
            </AdminSection>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-[2rem] border border-white/10 bg-black/15 p-4">
          {alreadyPublished(phase) ? (
            <Button type="submit" name="intent" value="save" disabled={pending} className="min-w-40">
              {pending ? text('saving') : text('saveChanges')}
            </Button>
          ) : (
            <>
              <Button type="submit" name="intent" value="save" tone="ghost" disabled={pending} className="min-w-40">
                {pending ? text('saving') : text('save')}
              </Button>
              <Button type="submit" name="intent" value="publish" disabled={pending} className="min-w-40">
                {text('publish')}
              </Button>
            </>
          )}
          {result?.notice === 'saved' ? <p className="text-sm font-semibold text-emerald-300">{text('saved')}</p> : null}
          {result?.notice === 'invalid' || result?.notice === 'denied' ? <p className="text-sm font-semibold text-ozora-coral">{text('invalid')}</p> : null}
        </div>
      </form>
      <ArtistEditor
        artist={editing}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={(artist) => {
          setCatalog((current) => {
            const rest = current.filter((item) => item.id !== artist.id);
            return [...rest, artist].sort((left, right) => left.name.localeCompare(right.name));
          });
          setLineup((current) => {
            const exists = current.some((entry) => entry.artistId === artist.id || entry.name.toLowerCase() === artist.name.toLowerCase());
            if (!exists) {
              return [...current, { name: artist.name, artistId: artist.id }];
            }
            return current.map((entry) =>
              entry.artistId === artist.id || entry.name.toLowerCase() === artist.name.toLowerCase()
                ? { ...entry, name: artist.name, artistId: artist.id }
                : entry,
            );
          });
        }}
      />
      <VenueEditor
        open={venueOpen}
        onClose={() => setVenueOpen(false)}
        onSaved={(venue) => {
          setPlaces((current) => {
            const rest = current.filter((place) => place.id !== venue.id);
            return [...rest, venue].sort((left, right) => left.name.localeCompare(right.name));
          });
          chooseVenue(venue.id, venue.city);
        }}
      />
    </main>
  );
}

function ArtistFace({ artist }: { artist?: ArtistProfile }) {
  if (artist?.photo) {
    return <img src={artist.photo} alt="" className="h-12 w-12 rounded-full object-cover" />;
  }
  return <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-bold">{artist?.name.slice(0, 1) ?? '+'}</span>;
}
