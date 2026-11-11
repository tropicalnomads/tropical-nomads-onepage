'use client';

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePenLine,
  MapPin,
  Music2,
  Ticket,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ManagedParty } from 'tropical-nomads-api/parties';
import { publicHttpsUrl, type Locale } from 'tropical-nomads-shared';
import { eventBoardDetails, eventPhase, eventPhaseCounts, groupEventBoard, type EventPhase, type EventTicketSummary } from '../admin/event-board';
import { uploadedEventFlyer } from '../admin/event-image';
import { adminText, eventText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { TextLink } from './ui/Button';

const phaseOrder = ['draft', 'published', 'ended'] as const satisfies readonly EventPhase[];
const phaseCountStyles: Record<EventPhase, string> = {
  draft: 'border-ozora-yellow/20 bg-ozora-yellow/[0.07] text-ozora-yellow',
  published: 'border-ozora-turquoise/20 bg-ozora-turquoise/[0.07] text-ozora-turquoise',
  ended: 'border-white/10 bg-white/[0.04] text-ozora-cream/55',
};

function PhaseIcon({ phase, size = 14 }: { phase: EventPhase; size?: number }) {
  switch (phase) {
    case 'draft':
      return <FilePenLine size={size} aria-hidden="true" />;
    case 'published':
      return <CheckCircle2 size={size} aria-hidden="true" />;
    case 'ended':
      return <Clock3 size={size} aria-hidden="true" />;
    default: {
      const unreachable: never = phase;
      return unreachable;
    }
  }
}

function phaseLabel(language: Locale, phase: EventPhase): string {
  switch (phase) {
    case 'draft':
      return adminText(language, 'draft');
    case 'published':
      return adminText(language, 'published');
    case 'ended':
      return adminText(language, 'ended');
    default: {
      const unreachable: never = phase;
      return unreachable;
    }
  }
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function euroPrice(amount: number, language: Locale): string {
  switch (language) {
    case 'en':
      return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
    case 'pt':
      return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount);
    default: {
      const unreachable: never = language;
      return unreachable;
    }
  }
}

function ticketLine(language: Locale, tickets: EventTicketSummary): string {
  const typeKey = tickets.typeCount === 1 ? 'ticketType' : 'ticketTypes';
  const types = fill(adminText(language, typeKey), { count: String(tickets.typeCount) });
  const price = fill(adminText(language, 'ticketFrom'), { price: euroPrice(tickets.lowestEuro, language) });
  const capacity = fill(adminText(language, 'ticketCapacity'), { count: String(tickets.capacity) });
  return `${types} · ${price} · ${capacity}`;
}

function eventFlyerSrc(party: ManagedParty): string | undefined {
  const images = party.event.images;
  const localBanner = images?.bannerLocal;
  if (localBanner?.startsWith('/events/banners/')) {
    return `/catalog-assets/banners/${localBanner.slice('/events/banners/'.length)}`;
  }
  return publicHttpsUrl(images?.small) ?? uploadedEventFlyer(images?.full) ?? publicHttpsUrl(images?.full);
}

export function AdminDenied() {
  const { language } = useLanguage();
  return (
    <main className="flex min-h-[65vh] items-center px-5 py-12 md:px-8">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-ozora-navy/60 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ozora-coral/10 text-ozora-coral">
          <CalendarDays size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold text-ozora-cream">{adminText(language, 'deniedTitle')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ozora-cream/65">{adminText(language, 'deniedBody')}</p>
      </div>
    </main>
  );
}

export function AdminEventList({ parties, now = new Date() }: { parties: readonly ManagedParty[]; now?: Date }) {
  const { language } = useLanguage();
  const board = groupEventBoard(parties, now);
  const counts = eventPhaseCounts(parties, now);
  return (
    <>
        {parties.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center">
            <CalendarDays className="mx-auto text-ozora-cream/25" size={34} aria-hidden="true" />
            <p className="mt-4 text-sm text-ozora-cream/65">{adminText(language, 'empty')}</p>
          </div>
        ) : null}
        {parties.length > 0 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {phaseOrder.map((phase) => (
              <div key={phase} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${phaseCountStyles[phase]}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-current/10">
                  <PhaseIcon phase={phase} size={17} />
                </div>
                <span className="text-lg font-bold">{counts[phase]}</span>
                <span className="text-sm font-semibold opacity-80">{phaseLabel(language, phase)}</span>
              </div>
            ))}
          </div>
        ) : null}
        <EventSection title={adminText(language, 'comingUp')} section="coming-up" parties={board.comingUp} now={now} />
        <EventSection title={adminText(language, 'endedSection')} section="ended" parties={board.ended} now={now} />
    </>
  );
}

function EventSection({
  title,
  section,
  parties,
  now,
}: {
  title: string;
  section: 'coming-up' | 'ended';
  parties: readonly ManagedParty[];
  now: Date;
}) {
  if (parties.length === 0) {
    return null;
  }
  return (
    <section className="mt-10" data-section={section}>
      <div className="flex items-center gap-3">
        <h2 className="font-display text-xl font-bold text-ozora-cream">{title}</h2>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/[0.07] px-2 text-xs font-bold text-ozora-cream/60">
          {parties.length}
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <ul className="mt-4 space-y-3">
        {parties.map((party) => (
          <EventBoardRow key={party.id} party={party} now={now} />
        ))}
      </ul>
    </section>
  );
}

function EventBoardRow({ party, now }: { party: ManagedParty; now: Date }) {
  const { language } = useLanguage();
  const details = eventBoardDetails(party, eventText(language, 'dateLocale'), now);
  const flyerSrc = eventFlyerSrc(party);
  return (
    <li>
      <a
        href={`/admin/events/${party.id}`}
        className={`group grid gap-4 rounded-3xl border border-white/10 bg-ozora-navy/50 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-ozora-turquoise/35 hover:bg-ozora-navy/75 hover:shadow-[0_22px_55px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise sm:items-center sm:p-5 ${
          flyerSrc
            ? 'grid-cols-[5.5rem_minmax(0,1fr)_4.25rem] items-stretch sm:grid-cols-[6.5rem_minmax(0,1fr)_5rem_auto]'
            : 'sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]'
        }`}
      >
        {details.stub ? (
          <span className="flex h-full min-h-24 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-center sm:flex-col sm:gap-0">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-ozora-turquoise">{details.stub.weekday}</span>
            <span className="font-display text-3xl font-bold leading-none text-ozora-cream sm:my-1">{details.stub.day}</span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-ozora-cream/55">{details.stub.month}</span>
          </span>
        ) : null}
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-bold leading-snug text-ozora-cream transition group-hover:text-ozora-yellow md:text-xl">
              {party.event.title}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${phaseCountStyles[details.phase]}`}
              data-phase={details.phase}
            >
              <PhaseIcon phase={details.phase} />
              {phaseLabel(language, details.phase)}
            </span>
          </span>
          <span className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ozora-cream/60">
            {details.when !== '' ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} className="text-ozora-turquoise" aria-hidden="true" />
                {details.when}
              </span>
            ) : null}
            {details.place !== '' ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-ozora-coral" aria-hidden="true" />
                {details.place}
              </span>
            ) : null}
          </span>
          {details.lineup !== '' ? (
            <span className="mt-2 flex items-start gap-1.5 text-sm text-ozora-cream/50">
              <Music2 size={15} className="mt-0.5 shrink-0 text-ozora-yellow" aria-hidden="true" />
              <span className="line-clamp-1">{details.lineup}</span>
            </span>
          ) : null}
          {details.tickets ? (
            <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.07] pt-3 text-xs font-semibold text-ozora-cream/50">
              <span className="inline-flex items-center gap-1.5">
                <Ticket size={14} aria-hidden="true" />
                {ticketLine(language, details.tickets)}
              </span>
            </span>
          ) : null}
        </span>
        {flyerSrc ? (
          <span className="relative min-h-24 overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_10px_25px_rgba(0,0,0,0.22)]">
            <img
              src={flyerSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
          </span>
        ) : null}
        <span className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ozora-cream/45 transition group-hover:border-ozora-turquoise/40 group-hover:bg-ozora-turquoise/10 group-hover:text-ozora-turquoise sm:flex">
          <ArrowRight size={18} aria-hidden="true" />
        </span>
      </a>
    </li>
  );
}

export function AdminEventEditor({
  heading,
  publication,
  event,
  children,
}: {
  heading: 'newEvent' | 'editEvent';
  publication?: 'draft' | 'published';
  event?: { dateStart: string; dateEnd?: string };
  children: ReactNode;
}) {
  const { language } = useLanguage();
  const phase =
    publication === undefined ? undefined : eventPhase({ publication, event: { dateStart: event?.dateStart ?? '', dateEnd: event?.dateEnd } });
  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <TextLink href="/admin/events" className="inline-flex items-center gap-2 text-sm">
          <ArrowRight className="rotate-180" size={16} aria-hidden="true" />
          {adminText(language, 'back')}
        </TextLink>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-white/10 pb-6">
          <h1 className="font-display text-3xl font-bold text-ozora-cream md:text-4xl">{adminText(language, heading)}</h1>
          {phase ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${phaseCountStyles[phase]}`}>
              <PhaseIcon phase={phase} />
              {phaseLabel(language, phase)}
            </span>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}
