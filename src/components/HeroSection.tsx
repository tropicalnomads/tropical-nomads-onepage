import { Globe, Instagram, Music, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onExploreEvents: () => void;
}

const HIGHLIGHTS: ReadonlyArray<{ icon: typeof Globe; label: string }> = [
  { icon: Sparkles, label: 'Brazilian roots' },
  { icon: Globe, label: 'Parties across Europe' },
  { icon: Music, label: 'Psytrance culture' },
];

export function HeroSection({ onExploreEvents }: HeroSectionProps): JSX.Element {
  return (
    <section id="home" className="px-5 py-8 md:px-8">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-7 text-center shadow-2xl backdrop-blur-sm md:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-ozora-turquoise/20 blur-3xl"
        />

        <div className="relative">
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="mx-auto h-16 w-auto object-contain md:h-20"
          />

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-ozora-turquoise md:text-sm">
            Brazilian psytrance crew
          </p>

          <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight text-ozora-cream md:text-5xl">
            Psytrance with a Brazilian touch
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ozora-cream/85 md:text-lg">
            Tropical Nomads is a Brazilian crew based in Europe, carrying the warmth and energy of
            the Brazilian psytrance scene to dancefloors across the continent. We throw parties all
            around Europe, uniting artists and dancers under one psychedelic, tropical family and
            keeping the culture alive with an unmistakably Brazilian touch.
          </p>


          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onExploreEvents}
              className="inline-flex w-full items-center justify-center rounded-xl bg-ozora-green px-5 py-3 text-sm font-bold text-ozora-ink transition hover:bg-ozora-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-ozora-navy sm:w-auto"
              aria-label="Scroll to upcoming events"
            >
              Explore upcoming events
            </button>
            <a
              href="https://www.instagram.com/tropicalnomads.events/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ozora-pink/50 bg-ozora-pink/10 px-5 py-3 text-sm font-semibold text-ozora-cream transition hover:border-ozora-yellow hover:bg-ozora-yellow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow sm:w-auto"
            >
              <Instagram size={16} aria-hidden="true" />
              Follow our journey
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
