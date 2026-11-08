export interface UpcomingPartner {
  id: string;
  name: string;
  href?: string;
  logoSrc?: string;
}

export interface UpcomingEventCard {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  timezone?: string;
  durationHours?: number;
  venueName?: string;
  city?: string;
  country?: string;
  mapUrl?: string;
  cardArtists: string[];
  stages: { artists: string[] }[];
  ticketUrl?: string;
  ticketsOnSale: boolean;
  timetableUrl?: string;
  bannerSrc?: string;
  partners: UpcomingPartner[];
}
