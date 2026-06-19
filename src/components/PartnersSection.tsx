import { Instagram, MapPin } from 'lucide-react';
import type { Partner } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';

interface PartnersSectionProps {
  partners: Partner[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function PartnersSection({ partners }: PartnersSectionProps): JSX.Element {
  return (
    <section id="partners" className="safe-x px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">Partners</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">
          The crews we join forces with across Europe.
        </p>

        {partners.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No partners yet" description="Our partner crews will appear here." />
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
                aria-label={`Open ${partner.name} on Instagram`}
              >
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    loading="lazy"
                    className="h-24 w-24 rounded-full border border-white/15 object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-ozora-turquoise/40 to-ozora-pink/40 text-2xl font-black text-ozora-cream transition group-hover:scale-105"
                  >
                    {initials(partner.name)}
                  </span>
                )}

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
