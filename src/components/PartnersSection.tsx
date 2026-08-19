import { Instagram, MapPin } from 'lucide-react';
import { getPartnerInstagrams, type Partner } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';
import { PartnerAvatar } from '@/components/PartnerAvatar';
import { useI18n } from '@/i18n/I18nProvider';

interface PartnersSectionProps {
  partners: Partner[];
}

export function PartnersSection({ partners }: PartnersSectionProps): JSX.Element {
  const { t } = useI18n();
  return (
    <section id="partners" className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">{t.partners}</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">
          {t.partnersSubtitle}
        </p>

        {partners.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={t.noPartnersTitle} description={t.noPartnersBody} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {partners.map((partner) => {
              const instagrams = getPartnerInstagrams(partner);
              return (
                <article
                  key={partner.id}
                  className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] via-black/20 to-black/35 p-4 text-center shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-ozora-turquoise/40 hover:from-ozora-turquoise/10 hover:shadow-xl hover:shadow-black/20"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-ozora-yellow/45 to-transparent"
                  />
                  <a
                    href={partner.instagram}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-pink"
                    aria-label={t.openOnInstagramAria(partner.name)}
                  >
                    <PartnerAvatar partner={partner} className="h-20 w-20" textClassName="text-xl" />
                  </a>

                  <h3 className="mt-3 text-sm font-semibold leading-tight text-ozora-cream group-hover:text-ozora-yellow">
                    {partner.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ozora-cream/70">
                    <MapPin size={12} aria-hidden="true" />
                    {partner.city}
                  </p>
                  <div className="mt-2 flex w-full flex-col items-center gap-1.5">
                    {instagrams.map((account) => (
                      <a
                        key={account.url}
                        href={account.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-ozora-cream/85 transition hover:bg-white/10 hover:text-ozora-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-pink"
                        aria-label={t.openOnInstagramAria(account.handle)}
                      >
                        <Instagram size={12} aria-hidden="true" className="shrink-0" />
                        <span className="truncate">{account.handle}</span>
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
