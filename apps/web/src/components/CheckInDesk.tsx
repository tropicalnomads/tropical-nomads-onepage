'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  addGuestAction,
  checkInGuestAction,
  checkInTicketAction,
  createGuestListAction,
  type CheckInActionResult,
} from '../check-in/actions';
import { QrCamera } from '../check-in/camera';
import { areaText, checkInText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

export interface CheckInEventOption {
  id: string;
  title: string;
}

export interface CheckInSoldRow {
  ticketId: string;
  name: string;
  offerName: string;
  state: 'unpaid' | 'checked' | 'open';
}

export interface CheckInGuestRow {
  guestId: string;
  listId: string;
  listName: string;
  name: string;
  state: 'checked' | 'open';
}

function resultText(language: Parameters<typeof checkInText>[0], result: CheckInActionResult): string {
  if (result.admitted) {
    return checkInText(language, 'admitted');
  }
  switch (result.reason) {
    case 'already used':
      return checkInText(language, 'alreadyUsed');
    case 'wrong party':
      return checkInText(language, 'wrongParty');
    case 'unknown':
      return checkInText(language, 'unknown');
    case 'unpaid':
      return checkInText(language, 'unpaid');
    case 'denied':
    case undefined:
      return checkInText(language, 'refused');
    default: {
      const unexpected: never = result.reason;
      return unexpected;
    }
  }
}

export function CheckInDesk({
  events,
  partyId,
  query,
  admin,
  sold,
  guests,
  lists,
}: {
  events: readonly CheckInEventOption[];
  partyId?: string;
  query: string;
  admin: boolean;
  sold: readonly CheckInSoldRow[];
  guests: readonly CheckInGuestRow[];
  lists: readonly { id: string; name: string }[];
}) {
  const { language } = useLanguage();
  const router = useRouter();
  const [result, setResult] = useState<CheckInActionResult | null>(null);
  const selected = events.find((event) => event.id === partyId);

  async function run(action: (formData: FormData) => Promise<CheckInActionResult>, form: HTMLFormElement): Promise<void> {
    const outcome = await action(new FormData(form));
    setResult(outcome);
    router.refresh();
  }

  function onSubmit(action: (formData: FormData) => Promise<CheckInActionResult>) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void run(action, event.currentTarget);
    };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{areaText(language, 'check-in')}</h1>
      <div>
        <h2 className="text-lg font-semibold text-ozora-cream">{checkInText(language, 'chooseEvent')}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id}>
              <a
                href={`/check-in?event=${encodeURIComponent(event.id)}`}
                className={`block rounded-xl border px-3 py-3 ${
                  event.id === partyId ? 'border-ozora-yellow/60 bg-ozora-yellow/10' : 'border-white/10 bg-black/20'
                }`}
              >
                {event.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {selected ? (
        <div className="space-y-6">
          <form action="/check-in" className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="event" value={selected.id} />
            <label className="flex-1 text-sm text-ozora-cream">
              {checkInText(language, 'searchLabel')}
              <input
                name="q"
                defaultValue={query}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-ozora-cream"
              />
            </label>
            <button type="submit" className="self-end rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink">
              {checkInText(language, 'searchButton')}
            </button>
          </form>
          {query && sold.length === 0 && guests.length === 0 ? <p className="text-sm text-ozora-cream/70">{checkInText(language, 'noPeople')}</p> : null}
          <section>
            <h2 className="text-lg font-semibold text-ozora-cream">{checkInText(language, 'soldTitle')}</h2>
            <ul className="mt-3 space-y-2">
              {sold.map((row) => (
                <li key={row.ticketId} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block font-semibold text-ozora-cream">{row.name}</span>
                    <span className="text-sm text-ozora-cream/70">{row.offerName}</span>
                  </span>
                  <RowAction partyId={selected.id} idName="ticketId" id={row.ticketId} state={row.state} action={checkInTicketAction} onSubmit={onSubmit} />
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ozora-cream">{checkInText(language, 'guestsTitle')}</h2>
            <ul className="mt-3 space-y-2">
              {guests.map((row) => (
                <li key={row.guestId} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block font-semibold text-ozora-cream">{row.name}</span>
                    <span className="text-sm text-ozora-cream/70">{row.listName}</span>
                  </span>
                  <RowAction partyId={selected.id} idName="guestId" id={row.guestId} state={row.state} action={checkInGuestAction} onSubmit={onSubmit} />
                </li>
              ))}
            </ul>
            {admin ? (
              <div className="mt-4 space-y-3">
                <form onSubmit={onSubmit(createGuestListAction)} className="flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="partyId" value={selected.id} />
                  <input name="listName" placeholder={checkInText(language, 'listName')} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-ozora-cream" />
                  <button type="submit" className="rounded-lg border border-ozora-turquoise/70 px-4 py-2 text-sm font-semibold text-ozora-cream">
                    {checkInText(language, 'createList')}
                  </button>
                </form>
                {lists.map((list) => (
                  <form key={list.id} onSubmit={onSubmit(addGuestAction)} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="partyId" value={selected.id} />
                    <input type="hidden" name="listId" value={list.id} />
                    <input name="guestName" placeholder={checkInText(language, 'guestName')} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-ozora-cream" />
                    <button type="submit" className="rounded-lg border border-ozora-turquoise/70 px-4 py-2 text-sm font-semibold text-ozora-cream">
                      {checkInText(language, 'addGuest')}
                    </button>
                  </form>
                ))}
              </div>
            ) : null}
          </section>
          <QrCamera partyId={selected.id} onResult={setResult} />
          {result ? (
            <p role="status" className="text-sm text-ozora-yellow">
              {resultText(language, result)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RowAction({
  partyId,
  idName,
  id,
  state,
  action,
  onSubmit,
}: {
  partyId: string;
  idName: 'ticketId' | 'guestId';
  id: string;
  state: 'unpaid' | 'checked' | 'open';
  action: (formData: FormData) => Promise<CheckInActionResult>;
  onSubmit: (action: (formData: FormData) => Promise<CheckInActionResult>) => (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { language } = useLanguage();
  const label = state === 'checked' ? 'checked' : state === 'unpaid' ? 'unpaid' : 'ready';
  if (state !== 'open') {
    return <span className="text-sm font-semibold text-ozora-yellow">{checkInText(language, label)}</span>;
  }
  return (
    <form onSubmit={onSubmit(action)}>
      <input type="hidden" name="partyId" value={partyId} />
      <input type="hidden" name={idName} value={id} />
      <button type="submit" className="rounded-lg bg-ozora-coral px-3 py-2 text-sm font-semibold text-ozora-ink">
        {checkInText(language, 'checkIn')}
      </button>
    </form>
  );
}
