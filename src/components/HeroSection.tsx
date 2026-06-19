interface HeroSectionProps {
  onExploreEvents: () => void;
}

export function HeroSection({ onExploreEvents }: HeroSectionProps): JSX.Element {
  return (
    <section id="home" className="safe-x px-4 pb-16 pt-14 md:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-sm md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ozora-turquoise">Tropical Nomads</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-ozora-cream md:text-6xl">
          Tropical Nomads Events
        </h1>
        <p className="mt-5 max-w-2xl text-base text-ozora-cream/85 md:text-lg">
          Journey through upcoming gatherings, revisit past highlights, and connect with our community.
        </p>
        <button
          type="button"
          onClick={onExploreEvents}
          className="mt-8 inline-flex items-center rounded-xl bg-ozora-green px-5 py-3 text-sm font-semibold text-ozora-ink transition hover:bg-ozora-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-ozora-navy"
          aria-label="Scroll to upcoming events"
        >
          Explore upcoming events
        </button>
      </div>
    </section>
  );
}
