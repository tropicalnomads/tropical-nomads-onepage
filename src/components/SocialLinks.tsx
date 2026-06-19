import { Facebook, Instagram } from 'lucide-react';
import type { SocialLink } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';
import { useI18n } from '@/i18n/I18nProvider';

interface SocialLinksProps {
  links: SocialLink[];
}

function platformIcon(platform: SocialLink['platform']): JSX.Element {
  switch (platform) {
    case 'instagram':
      return <Instagram size={20} aria-hidden="true" />;
    case 'facebook':
      return <Facebook size={20} aria-hidden="true" />;
    default: {
      const exhaustiveCheck: never = platform;
      return exhaustiveCheck;
    }
  }
}

export function SocialLinks({ links }: SocialLinksProps): JSX.Element {
  const { t } = useI18n();
  return (
    <section id="socials" className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">{t.stayConnected}</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">{t.stayConnectedSubtitle}</p>
        {links.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={t.noSocialLinksTitle} description={t.noSocialLinksBody} />
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => {
              return (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-3 rounded-xl border border-ozora-pink/40 bg-ozora-pink/10 px-4 py-3 text-ozora-cream transition hover:border-ozora-yellow hover:bg-ozora-yellow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
                    aria-label={t.openLinkAria(link.label)}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                      {platformIcon(link.platform)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{link.label}</span>
                      <span className="block text-xs text-ozora-cream/70">{link.handle}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
