"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

import type { VenuePoint } from "@/lib/content";

const geoUrl = "/geo/europe.json";

type EuropeMapProps = {
  venues: VenuePoint[];
};

export function EuropeMap({ venues }: EuropeMapProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card p-2">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [12, 52], scale: 450 }}
        width={900}
        height={600}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1f2937"
                stroke="#334155"
                strokeWidth={0.4}
              />
            ))
          }
        </Geographies>
        {venues.map((venue) => (
          <Marker key={`${venue.city}-${venue.status}`} coordinates={[venue.lng, venue.lat]}>
            <circle
              r={6}
              fill={venue.status === "upcoming" ? "#22c55e" : "#f59e0b"}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <text textAnchor="middle" y={-12} style={{ fontSize: "10px", fill: "#e2e8f0" }}>
              {venue.city}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}

