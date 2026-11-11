'use client';

import { useSignInHref } from '../account/use-return-path';
import { accountText, areaText, ticketText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';
import { Button } from './ui/Button';

export interface TicketRow {
  id: string;
  title: string;
  offerName: string;
  createdAt: string;
  ready: boolean;
  qrSvg?: string;
}

export function MyTickets({ signedIn, tickets }: { signedIn: boolean; tickets: readonly TicketRow[] }) {
  const { language } = useLanguage();
  const signInHref = useSignInHref();
  const label = areaText(language, 'my-tickets');
  const open = tickets.find((ticket) => ticket.qrSvg);

  return (
    <section className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{label}</h1>
        {!signedIn ? (
          <div className="mt-6">
            <EmptyState title={ticketText(language, 'signInTitle')} description={ticketText(language, 'signInBody')} />
            <Button href={signInHref} className="mt-4">
              {accountText(language, 'signIn')}
            </Button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={ticketText(language, 'emptyTitle')} description={ticketText(language, 'emptyBody')} />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <a
                    href={`/my-tickets?ticket=${ticket.id}`}
                    className={`block rounded-xl border px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise ${
                      ticket.qrSvg ? 'border-ozora-yellow/60 bg-ozora-yellow/10' : 'border-white/10 bg-black/20'
                    }`}
                  >
                    <span className="block font-semibold text-ozora-cream">{ticket.title}</span>
                    {ticket.offerName ? <span className="mt-1 block text-sm text-ozora-cream/75">{ticket.offerName}</span> : null}
                    <time dateTime={ticket.createdAt} className="mt-1 block text-xs text-ozora-cream/60">
                      {new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ticket.createdAt))}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
            {open?.qrSvg ? (
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6">
                <h2 className="text-lg font-semibold text-ozora-cream">{open.title}</h2>
                {open.ready ? (
                  <>
                    <p className="mt-2 text-sm text-ozora-yellow">{ticketText(language, 'ready')}</p>
                    <p className="mt-1 text-sm text-ozora-cream/80">{ticketText(language, 'notCharged')}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-ozora-yellow">{ticketText(language, 'unpaid')}</p>
                    <p className="mt-1 text-sm text-ozora-cream/80">{ticketText(language, 'notValid')}</p>
                  </>
                )}
                <div
                  className="mx-auto mt-4 w-full min-w-[240px] max-w-[280px] rounded-2xl bg-[#FFF8E7] p-3"
                  role="img"
                  aria-label={ticketText(language, 'qrLabel').replaceAll('{title}', open.title)}
                  dangerouslySetInnerHTML={{ __html: open.qrSvg }}
                />
                <Button href="/my-tickets" tone="back" size="sm" className="mt-4">
                  {ticketText(language, 'back')}
                </Button>
              </article>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
