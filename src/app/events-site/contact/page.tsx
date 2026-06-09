import { EventsContactClient } from "./contact-client";

export default function EventsContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="text-muted-foreground">
        Reach out for partnerships, venue proposals, collaborations, and event inquiries.
      </p>
      <EventsContactClient />
    </div>
  );
}

