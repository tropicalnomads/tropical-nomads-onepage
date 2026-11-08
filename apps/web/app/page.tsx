import { EmptyState } from '../../one-pager/src/components/EmptyState';
import { areaDescription } from '../src/areas';
import { navigation } from '../src/navigation';

export default function HomePage() {
  return (
    <main>
      <section className="px-5 py-8 md:px-8">
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
              Psytrance with a Brazilian touch
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ozora-cream/85 md:text-lg">
              The same parties, tickets, door, and shop. Nothing here is on sale yet.
            </p>
          </div>
        </div>
      </section>
      <section className="px-5 pb-8 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="block rounded-2xl transition hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
            >
              <EmptyState title={item.label} description={areaDescription[item.id]} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
