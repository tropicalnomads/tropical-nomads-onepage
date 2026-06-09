import { EuropeMap } from "@/components/europe-map";
import { getVenues } from "@/lib/party";

export default function EventsMapPage() {
  const venues = getVenues("events");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Europe Map</h1>
        <p className="text-muted-foreground">
          Explore where Tropical Nomads has played and where we are going next.
        </p>
      </div>
      <EuropeMap venues={venues} />
    </div>
  );
}

