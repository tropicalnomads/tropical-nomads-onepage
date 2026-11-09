import type { Locale } from 'tropical-nomads-shared';

export interface HomeCopy {
  description: string;
  exploreUpcoming: string;
  exploreUpcomingAria: string;
  followJourney: string;
  upcomingTitle: string;
  upcomingSubtitle: string;
  noUpcomingTitle: string;
  noUpcomingBody: string;
  nextUp: string;
  buyTickets: string;
  eventDetails: string;
  comingSoon: string;
  timetable: string;
  buyTicketsAria: string;
  goabaseAria: string;
  timetableAria: string;
  mapsAria: string;
  partnerAria: string;
  dateLocale: string;
  pastTitle: string;
  pastSubtitle: string;
  noPastTitle: string;
  noPastBody: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  showLess: string;
  noPastSearchTitle: string;
  noPastSearchBody: string;
  viewDetailsAria: string;
  openEventInstagramAria: string;
  close: string;
  closeDetailsAria: string;
  photos: string;
  videos: string;
  sets: string;
  mediaComingSoon: string;
  viewOnGoabase: string;
  partnersTitle: string;
  partnersSubtitle: string;
  noPartnersTitle: string;
  noPartnersBody: string;
  stayConnected: string;
  stayConnectedSubtitle: string;
  noSocialTitle: string;
  noSocialBody: string;
  openLinkAria: string;
}

export const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    description:
      'Tropical Nomads is a Brazilian crew based in Europe, carrying the warmth and energy of the Brazilian psytrance scene to dancefloors across the continent. We throw parties all around Europe, uniting artists and dancers under one psychedelic, tropical family and keeping the culture alive with an unmistakably Brazilian touch.',
    exploreUpcoming: 'Explore upcoming events',
    exploreUpcomingAria: 'Scroll to upcoming events',
    followJourney: 'Follow our journey',
    upcomingTitle: 'Upcoming events',
    upcomingSubtitle: 'All future dates, sorted from the next one.',
    noUpcomingTitle: 'No upcoming events',
    noUpcomingBody: 'Check back soon for newly announced dates.',
    nextUp: 'Next up',
    buyTickets: 'Buy tickets',
    eventDetails: 'Event details',
    comingSoon: 'Coming soon',
    timetable: 'Timetable',
    buyTicketsAria: 'Buy tickets for {title}',
    goabaseAria: 'View {title} on goabase',
    timetableAria: 'Open timetable for {title}',
    mapsAria: 'Open {place} on Google Maps',
    partnerAria: 'Open {name} on Instagram',
    dateLocale: 'en',
    pastTitle: 'Past events',
    pastSubtitle: 'A look back at our previous gatherings.',
    noPastTitle: 'No past events yet',
    noPastBody: 'Our history will appear here.',
    searchLabel: 'Search past events',
    searchPlaceholder: 'Search by event, city, or artist',
    clearSearch: 'Clear search',
    showLess: 'Show less',
    noPastSearchTitle: 'No matching events',
    noPastSearchBody: 'Try another artist, city, or event name.',
    viewDetailsAria: 'View details for {title}',
    openEventInstagramAria: 'Open {title} on Instagram',
    close: 'Close',
    closeDetailsAria: 'Close details',
    photos: 'Photos',
    videos: 'Videos',
    sets: 'Sets',
    mediaComingSoon: 'Photos and videos coming soon.',
    viewOnGoabase: 'View on goabase',
    partnersTitle: 'Partners',
    partnersSubtitle: 'The crews we join forces with across Europe.',
    noPartnersTitle: 'No partners yet',
    noPartnersBody: 'Our partner crews will appear here.',
    stayConnected: 'Stay connected',
    stayConnectedSubtitle: 'Follow Tropical Nomads and friends across our socials.',
    noSocialTitle: 'No social links',
    noSocialBody: 'Social profiles will appear here.',
    openLinkAria: 'Open {label}',
  },
  pt: {
    description:
      'A Tropical Nomads é uma crew brasileira baseada na Europa, levando o calor e a energia da cena psytrance brasileira para as pistas de todo o continente. Fazemos festas por toda a Europa, unindo a comunidade em uma família psicodélica e tropical, mantendo a cultura do psytrance viva com um toque bem brasileiro.',
    exploreUpcoming: 'Explorar próximos eventos',
    exploreUpcomingAria: 'Ir para os próximos eventos',
    followJourney: 'Acompanhe nossa jornada',
    upcomingTitle: 'Próximos eventos',
    upcomingSubtitle: 'Todas as datas futuras, a partir da próxima.',
    noUpcomingTitle: 'Nenhum evento futuro',
    noUpcomingBody: 'Volte em breve para novas datas anunciadas.',
    nextUp: 'A seguir',
    buyTickets: 'Comprar ingressos',
    eventDetails: 'Detalhes do evento',
    comingSoon: 'Em breve',
    timetable: 'Programação',
    buyTicketsAria: 'Comprar ingressos para {title}',
    goabaseAria: 'Ver {title} no goabase',
    timetableAria: 'Abrir programação de {title}',
    mapsAria: 'Abrir {place} no Google Maps',
    partnerAria: 'Abrir {name} no Instagram',
    dateLocale: 'pt-BR',
    pastTitle: 'Eventos passados',
    pastSubtitle: 'Uma retrospectiva dos nossos encontros anteriores.',
    noPastTitle: 'Ainda sem eventos passados',
    noPastBody: 'Nosso histórico aparecerá aqui.',
    searchLabel: 'Buscar eventos passados',
    searchPlaceholder: 'Busque por evento, cidade ou artista',
    clearSearch: 'Limpar busca',
    showLess: 'Mostrar menos',
    noPastSearchTitle: 'Nenhum evento encontrado',
    noPastSearchBody: 'Tente outro artista, cidade ou nome de evento.',
    viewDetailsAria: 'Ver detalhes de {title}',
    openEventInstagramAria: 'Abrir {title} no Instagram',
    close: 'Fechar',
    closeDetailsAria: 'Fechar detalhes',
    photos: 'Fotos',
    videos: 'Vídeos',
    sets: 'Sets',
    mediaComingSoon: 'Fotos e vídeos em breve.',
    viewOnGoabase: 'Ver no goabase',
    partnersTitle: 'Parceiros',
    partnersSubtitle: 'As crews com quem unimos forças pela Europa.',
    noPartnersTitle: 'Ainda sem parceiros',
    noPartnersBody: 'Nossas crews parceiras aparecerão aqui.',
    stayConnected: 'Fique por dentro',
    stayConnectedSubtitle: 'Siga a Tropical Nomads e amigos nas nossas redes.',
    noSocialTitle: 'Sem redes sociais',
    noSocialBody: 'Os perfis sociais aparecerão aqui.',
    openLinkAria: 'Abrir {label}',
  },
};

export function fillHome(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

export function homePastCount(language: Locale, shown: number, total: number): string {
  switch (language) {
    case 'en':
      return shown === total ? `${total} event${total === 1 ? '' : 's'}` : `Showing ${shown} of ${total} events`;
    case 'pt':
      return shown === total ? `${total} evento${total === 1 ? '' : 's'}` : `Mostrando ${shown} de ${total} eventos`;
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

export function homeShowMore(language: Locale, count: number): string {
  switch (language) {
    case 'en':
      return `Show ${count} more`;
    case 'pt':
      return `Mostrar mais ${count}`;
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}
