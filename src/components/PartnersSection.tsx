import { Instagram, MapPin } from 'lucide-react';
import type { Partner } from '@/lib/data';
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <a
                key={partner.id}
                href={partner.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex flex-col items-center rounded-2xl border border-white/10 bg-black/20 p-6 text-center transition hover:border-ozora-pink/60 hover:bg-ozora-pink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-pink"
                aria-label={t.openOnInstagramAria(partner.name)}
              >
                <PartnerAvatar partner={partner} />

                <h3 className="mt-4 text-lg font-semibold text-ozora-cream group-hover:text-ozora-yellow">
                  {partner.name}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ozora-cream/70">
                  <MapPin size={14} aria-hidden="true" />
                  {partner.city}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-ozora-cream/85">
                  <Instagram size={14} aria-hidden="true" />
                  {partner.handle}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
