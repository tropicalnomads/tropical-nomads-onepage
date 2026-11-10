import type { ReactNode } from 'react';

export const adminFieldClass =
  'w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-ozora-cream outline-none transition placeholder:text-ozora-cream/30 focus:border-ozora-turquoise focus:ring-2 focus:ring-ozora-turquoise/15';

export function AdminSection({ icon, title, help, children }: { icon?: ReactNode; title: string; help?: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
      <div className="flex items-center gap-3">
        {icon ? <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ozora-turquoise/10 text-ozora-turquoise">{icon}</span> : null}
        <div>
          <h2 className="font-display text-xl font-bold text-ozora-cream">{title}</h2>
          {help ? <p className="text-xs text-ozora-cream/45">{help}</p> : null}
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}
