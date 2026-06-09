import { getEvents } from "@/lib/party";
export default function Events() {
  const events = getEvents();
  return (
    <div className="section">
      <h1 className="section-title">Events</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {events.map(e => (
          <a key={e.slug} href={`/events/${e.slug}`} className="block">
            <div className="aspect-[3/4] card" />
            <div className="mt-2 text-sm muted">{new Date(e.startDate).toLocaleDateString()} — {e.title}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
