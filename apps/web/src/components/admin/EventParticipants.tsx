'use client';

import { useState, type KeyboardEvent } from 'react';
import type { ParticipantRow, ParticipantStatus, ParticipantStatusFilter } from '../../admin/event-participants';
import { filterParticipants, participantCounts, participantTicketTypes } from '../../admin/event-participants';
import { adminText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { adminFieldClass } from './form';
import { Button } from '../ui/Button';

const statusClass: Record<ParticipantStatus, string> = {
  checked: 'border-ozora-turquoise/30 bg-ozora-turquoise/10 text-ozora-turquoise',
  open: 'border-ozora-yellow/30 bg-ozora-yellow/10 text-ozora-yellow',
  unpaid: 'border-ozora-coral/30 bg-ozora-coral/10 text-ozora-coral',
};

function keepEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
}

export function EventParticipants({ rows, eventId }: { rows: readonly ParticipantRow[]; eventId: string }) {
  const { language } = useLanguage();
  const text = (key: Parameters<typeof adminText>[1]) => adminText(language, key);
  const [query, setQuery] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [status, setStatus] = useState<ParticipantStatusFilter>('all');
  const counts = participantCounts(rows);
  const types = participantTicketTypes(rows);
  const visible = filterParticipants(rows, query, ticketType, status);
  const checkInHref = `/check-in?event=${encodeURIComponent(eventId)}`;

  function statusLabel(value: ParticipantStatus): string {
    switch (value) {
      case 'checked':
        return text('participantChecked');
      case 'open':
        return text('participantOpen');
      case 'unpaid':
        return text('participantUnpaid');
      default: {
        const unexpected: never = value;
        return unexpected;
      }
    }
  }

  return (
    <div className="mt-8" role="tabpanel">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-ozora-navy/55">
        <div className="p-5 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="grid flex-1 grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-ozora-ink/20">
              <p className="relative min-w-0 px-3 py-4 sm:px-5 sm:py-5">
                <span className="absolute inset-x-3 top-0 h-px bg-ozora-turquoise/70 sm:inset-x-5" />
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.13em] text-ozora-cream/45 sm:text-xs sm:tracking-[0.16em]">
                  {text('participantPeople')}
                </span>
                <span className="mt-2 block font-display text-3xl font-bold tabular-nums tracking-[-0.04em] text-ozora-cream sm:text-4xl">{counts.people}</span>
              </p>
              <p className="relative min-w-0 px-3 py-4 sm:px-5 sm:py-5">
                <span className="absolute inset-x-3 top-0 h-px bg-ozora-yellow/70 sm:inset-x-5" />
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.13em] text-ozora-cream/45 sm:text-xs sm:tracking-[0.16em]">
                  {text('participantCheckedCount')}
                </span>
                <span className="mt-2 block font-display text-3xl font-bold tabular-nums tracking-[-0.04em] text-ozora-yellow sm:text-4xl">{counts.checkedIn}</span>
              </p>
              <p className="relative min-w-0 px-3 py-4 sm:px-5 sm:py-5">
                <span className="absolute inset-x-3 top-0 h-px bg-ozora-coral/70 sm:inset-x-5" />
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.13em] text-ozora-cream/45 sm:text-xs sm:tracking-[0.16em]">
                  {text('participantWaitingCount')}
                </span>
                <span className="mt-2 block font-display text-3xl font-bold tabular-nums tracking-[-0.04em] text-ozora-coral sm:text-4xl">{counts.waiting}</span>
              </p>
            </div>
            <Button href={checkInHref} tone="ghost" size="sm" className="shrink-0 self-start border border-white/10">
              {text('openCheckIn')}
            </Button>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-6 md:grid-cols-[minmax(0,1fr)_14rem_14rem]">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
              {text('participantSearch')}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={keepEnter}
                className={`${adminFieldClass} mt-2`}
              />
            </label>
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
              {text('participantType')}
              <select value={ticketType} onChange={(event) => setTicketType(event.target.value)} className={`${adminFieldClass} mt-2`}>
                <option value="">{text('participantAllTypes')}</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
              {text('participantStatusFilter')}
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value === 'checked' || event.target.value === 'open' || event.target.value === 'unpaid' ? event.target.value : 'all')}
                className={`${adminFieldClass} mt-2`}
              >
                <option value="all">{text('participantAllStatuses')}</option>
                <option value="checked">{text('participantChecked')}</option>
                <option value="open">{text('participantOpen')}</option>
                <option value="unpaid">{text('participantUnpaid')}</option>
              </select>
            </label>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="border-t border-white/10 px-5 py-8 text-sm text-ozora-cream/55 md:px-7">{text('participantEmpty')}</p>
        ) : visible.length === 0 ? (
          <p className="border-t border-white/10 px-5 py-8 text-sm text-ozora-cream/55 md:px-7">{text('participantNoMatch')}</p>
        ) : (
          <div className="overflow-x-auto border-t border-white/10">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-ozora-ink/40">
                <tr className="text-xs font-bold uppercase tracking-[0.14em] text-ozora-cream/45">
                  <th className="whitespace-nowrap px-5 py-3.5 font-bold md:pl-7">{text('participantName')}</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-bold">{text('participantEmail')}</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-bold">{text('ticketColumn')}</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-bold">{text('participantStatusFilter')}</th>
                  <th className="whitespace-nowrap px-5 py-3.5 font-bold md:pr-7">{text('participantNote')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visible.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-ozora-ink/20">
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-ozora-cream md:pl-7">{row.name.trim() === '' ? '—' : row.name}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-ozora-cream/70">{row.email.trim() === '' ? '—' : row.email}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-ozora-cream/80">{row.ticketType.trim() === '' ? '—' : row.ticketType}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass[row.status]}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="min-w-52 px-5 py-4 text-ozora-cream/60 md:pr-7">{row.note.trim() === '' ? '—' : row.note}</td>
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
