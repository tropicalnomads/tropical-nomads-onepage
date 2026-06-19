import { Facebook, Instagram } from 'lucide-react';
import type { SocialLink } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';

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
  return (
    <section id="socials" className="safe-x px-4 py-12 md:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">Stay connected</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">Follow Tropical Nomads and friends across our socials.</p>
        {links.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No social links" description="Social profiles will appear here." />
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
                    aria-label={`Open ${link.label}`}
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
