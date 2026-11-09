export interface HomeMediaLink {
  url: string;
  label?: string;
}

export interface HomeArtist {
  name: string;
  countryFlag?: string;
}

export interface HomeStage {
  name: string;
  genres: string[];
  artists: HomeArtist[];
}

export interface HomeEvent {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  timezone?: string;
  durationHours?: number;
  venueName?: string;
  city: string;
  country: string;
  address?: string;
  mapUrl?: string;
  cardArtists: string[];
  stages: HomeStage[];
  description?: string;
  bannerSrc?: string;
  ticketUrl?: string;
  ticketsOnSale: boolean;
  timetableUrl?: string;
  instagramPost?: string;
  goabaseUrl?: string;
  partnerIds: string[];
  photos: HomeMediaLink[];
  videos: HomeMediaLink[];
  sets: HomeMediaLink[];
}

export interface HomeInstagram {
  handle: string;
  url: string;
}

export interface HomePartner {
  id: string;
  name: string;
  city: string;
  handle: string;
  instagram: string;
  instagrams: HomeInstagram[];
  logoSrc?: string;
  logoFit?: 'cover' | 'contain';
}

export interface HomeSocial {
  id: string;
  platform: 'instagram' | 'facebook';
  label: string;
  handle: string;
  url: string;
}

export interface HomeCatalog {
  events: readonly HomeEvent[];
  partners: readonly HomePartner[];
  socials: readonly HomeSocial[];
  followHref: string;
}
