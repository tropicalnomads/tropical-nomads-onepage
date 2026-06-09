import { getParty } from "@/lib/party";

export default function EventsAboutPage() {
  const config = getParty("events");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">About Tropical Nomads</h1>
      <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-foreground/90">
        <p>
          Tropical Nomads is an events collective producing dance experiences across Europe, mixing
          international talent with local communities.
        </p>
        <p>
          {config.tagline ||
            "Our events bring immersive sound, visual storytelling, and a strong community-first vibe to each city."}
        </p>
      </div>
    </div>
  );
}

