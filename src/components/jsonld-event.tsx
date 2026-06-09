import { getGeneral, getParty } from "@/lib/party";

export function EventJsonLd() {
  const config = getParty();
  const general = getGeneral();

  if (!config.date) {
    return null;
  }

  const start = new Date(config.date).toISOString();
  const end = config.endDate
    ? new Date(config.endDate).toISOString()
    : new Date(new Date(config.date).getTime() + 14 * 60 * 60 * 1000).toISOString();
  const hasTicketUrl = typeof general.tickets?.url === "string" && general.tickets.url.length > 0;
  const includeOffers = !general.ticketsComingSoon && hasTicketUrl;
  const data = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: config.seo?.title || config.name,
    description: config.seo?.description || config.tagline,
    startDate: start,
    endDate: end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: config.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: config.city,
        addressRegion: "SC",
        addressCountry: "BR"
      }
    },
    image: [config.banner],
    organizer: {
      "@type": "Organization",
      name: config.name
    }
  };

  const payload = includeOffers
    ? {
        ...data,
        offers: {
          "@type": "Offer",
          url: general.tickets.url,
          availability: "https://schema.org/InStock"
        }
      }
    : data;

  return (
    <script
      id="jsonld-event"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}


