import { getEvents, getParty } from "@/lib/party";
export default function EventPage({ params }: { params: { slug: string } }) {
  const events = getEvents();
  const event = events.find(e => e.slug === params.slug);
  if (!event) return <div className="section">Event not found</div>;
  const cfg = getParty();
  return (
    <article className="section space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <div className="muted">
          {new Date(event.startDate).toLocaleString()} — {event.city}{event.venue ? ` • ${event.venue}` : ""}
        </div>
      </header>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card aspect-[16/9]" />
        <aside className="space-y-2">
          {event.links?.ra && <a className="btn-accent" href={event.links.ra}>Tickets on RA</a>}
          {cfg.socials?.instagram && <a className="btn" href={cfg.socials.instagram}>Follow on IG</a>}
        </aside>
      </div>
      {event.description && <p className="muted">{event.description}</p>}
      {event.lineup?.length ? (
        <section>
          <h2 className="section-title">Lineup</h2>
          <ul className="list-disc list-inside">
            {event.lineup.map(l => <li key={l.artistSlug}>{l.artistSlug}{l.headliner ? " (headliner)" : ""}</li>)}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
