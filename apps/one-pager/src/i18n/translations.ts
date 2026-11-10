export type Language = 'en' | 'pt';

export interface TranslationDict {
  // Date locale used for Intl.DateTimeFormat
  dateLocale: string;

  // Navigation (header + footer)
  navHome: string;
  navEvents: string;
  navGallery: string;
  navPartners: string;
  navSocials: string;
  navBookings: string;
  navShop: string;
  tickets: string;
  homeAria: string;
  openMenuAria: string;
  closeMenuAria: string;

  // Hero
  heroTagline: string;
  heroDescription: string;
  exploreUpcoming: string;
  exploreUpcomingAria: string;
  followJourney: string;

  // Footer
  footerTagline: string;

  // Social links
  stayConnected: string;
  stayConnectedSubtitle: string;
  noSocialLinksTitle: string;
  noSocialLinksBody: string;
  openLinkAria: (label: string) => string;

  // Partners
  partners: string;
  partnersSubtitle: string;
  noPartnersTitle: string;
  noPartnersBody: string;
  openOnInstagramAria: (name: string) => string;

  // Upcoming events
  upcomingEvents: string;
  upcomingEventsSubtitle: string;
  noUpcomingTitle: string;
  noUpcomingBody: string;
  nextUp: string;
  buyTickets: string;
  eventDetails: string;
  comingSoon: string;
  timetable: string;
  buyTicketsAria: (title: string) => string;
  openTimetableAria: (title: string) => string;
  viewOnGoabaseAria: (title: string) => string;
  openOnMapsAria: (place: string) => string;

  // Past events
  pastEvents: string;
  pastEventsSubtitle: string;
  noPastTitle: string;
  noPastBody: string;
  searchPastEvents: string;
  searchPastEventsPlaceholder: string;
  clearSearch: string;
  pastEventsResults: (shown: number, total: number) => string;
  showMorePastEvents: (count: number) => string;
  showLessPastEvents: string;
  noPastSearchTitle: string;
  noPastSearchBody: string;
  viewDetailsAria: (title: string) => string;
  openEventInstagramAria: (title: string) => string;

  // Lightbox modal
  close: string;
  closeDetailsAria: string;
  photos: string;
  videos: string;
  sets: string;
  mediaComingSoon: string;
  viewOnGoabase: string;

  // Language selector
  switchLanguageTo: (languageLabel: string) => string;

  // Shop
  shopTagline: string;
  shopHeadline: string;
  shopLead: string;
  shopTotal: (count: number) => string;
  shopReserveWhatsApp: string;
  shopPiecesTitle: string;
  shopPiecesSubtitle: string;
  shopChipParty: string;
  shopChipDrop: string;
  shopMetaHw: string;
  shopMetaPg: string;
  shopSizes: string;
  shopBookHw: string;
  shopBookPg: string;
  shopLeft: (count: number) => string;
  shopLastRun: string;
  shopMadeToOrder: string;
  shopLastOne: string;
  shopManyLeft: (count: number) => string;
  shopHowTitle: string;
  shopHowSubtitle: string;
  shopStep1Title: string;
  shopStep1Body: string;
  shopStep2Title: string;
  shopStep2Body: string;
  shopStep2Sample: string;
  shopCopyNumber: string;
  shopCopied: string;
  shopCopyFallback: string;
  shopStep3Title: string;
  shopStep3Body: string;
  shopWhatsAppMessage: (item: string) => string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    dateLocale: 'en',

    navHome: 'Home',
    navEvents: 'Events',
    navGallery: 'Gallery',
    navPartners: 'Partners',
    navSocials: 'Socials',
    navBookings: 'Bookings',
    navShop: 'Shop',
    tickets: 'Tickets',
    homeAria: 'Tropical Nomads home',
    openMenuAria: 'Open navigation menu',
    closeMenuAria: 'Close navigation menu',

    heroTagline: 'Psytrance with a Brazilian touch',
    heroDescription:
      'Tropical Nomads is a Brazilian crew based in Europe, carrying the warmth and energy of the Brazilian psytrance scene to dancefloors across the continent. We throw parties all around Europe, uniting artists and dancers under one psychedelic, tropical family and keeping the culture alive with an unmistakably Brazilian touch.',
    exploreUpcoming: 'Explore upcoming events',
    exploreUpcomingAria: 'Scroll to upcoming events',
    followJourney: 'Follow our journey',

    footerTagline: 'Tropical Nomads - made for the dancefloor community.',

    stayConnected: 'Stay connected',
    stayConnectedSubtitle: 'Follow Tropical Nomads and friends across our socials.',
    noSocialLinksTitle: 'No social links',
    noSocialLinksBody: 'Social profiles will appear here.',
    openLinkAria: (label) => `Open ${label}`,

    partners: 'Partners',
    partnersSubtitle: 'The crews we join forces with across Europe.',
    noPartnersTitle: 'No partners yet',
    noPartnersBody: 'Our partner crews will appear here.',
    openOnInstagramAria: (name) => `Open ${name} on Instagram`,

    upcomingEvents: 'Upcoming events',
    upcomingEventsSubtitle: 'All future dates, sorted from the next one.',
    noUpcomingTitle: 'No upcoming events',
    noUpcomingBody: 'Check back soon for newly announced dates.',
    nextUp: 'Next up',
    buyTickets: 'Buy tickets',
    eventDetails: 'Event details',
    comingSoon: 'Coming soon',
    timetable: 'Timetable',
    buyTicketsAria: (title) => `Buy tickets for ${title}`,
    openTimetableAria: (title) => `Open timetable for ${title}`,
    viewOnGoabaseAria: (title) => `View ${title} on goabase`,
    openOnMapsAria: (place) => `Open ${place} on Google Maps`,

    pastEvents: 'Past events',
    pastEventsSubtitle: 'A look back at our previous gatherings.',
    noPastTitle: 'No past events yet',
    noPastBody: 'Our history will appear here.',
    searchPastEvents: 'Search past events',
    searchPastEventsPlaceholder: 'Search by event, city, or artist',
    clearSearch: 'Clear search',
    pastEventsResults: (shown, total) =>
      shown === total
        ? `${total} event${total === 1 ? '' : 's'}`
        : `Showing ${shown} of ${total} events`,
    showMorePastEvents: (count) => `Show ${count} more`,
    showLessPastEvents: 'Show less',
    noPastSearchTitle: 'No matching events',
    noPastSearchBody: 'Try another artist, city, or event name.',
    viewDetailsAria: (title) => `View details for ${title}`,
    openEventInstagramAria: (title) => `Open ${title} on Instagram`,

    close: 'Close',
    closeDetailsAria: 'Close details',
    photos: 'Photos',
    videos: 'Videos',
    sets: 'Sets',
    mediaComingSoon: 'Photos and videos coming soon.',
    viewOnGoabase: 'View on goabase',

    switchLanguageTo: (languageLabel) => `Switch language to ${languageLabel}`,

    shopTagline: 'Shop · Tropical Nomads Halloween Special',
    shopHeadline: 'Reserve your T-Shirt, pick it up at the party',
    shopLead:
      "UV-reactive embroidery, made in Portugal. Limited stock for Saturday's party at The Sound House. Reserve it and it's held under your name.",
    shopTotal: (count) => `Only ${count} T-Shirts for the whole party`,
    shopReserveWhatsApp: 'Reserve on WhatsApp',
    shopPiecesTitle: 'Available T-Shirts',
    shopPiecesSubtitle: 'Pick up at the party, Saturday 24/10. Stock updated today.',
    shopChipParty: 'Party edition',
    shopChipDrop: 'Drop 01',
    shopMetaHw: 'UV embroidery that glows under blacklight. Tropical Nomads on the front, Halloween artwork on the back.',
    shopMetaPg: 'UV embroidery that glows under blacklight. Psy Groove on the front, artwork on the back.',
    shopSizes: 'Sizes',
    shopBookHw: 'Reserve the Halloween T-Shirt',
    shopBookPg: 'Reserve the Psy Groove T-Shirt',
    shopLeft: (count) => (count === 1 ? 'T-Shirt left' : 'T-Shirts left'),
    shopLastRun: 'Last production run',
    shopMadeToOrder: 'Then made to order only',
    shopLastOne: 'last one',
    shopManyLeft: (count) => `${count} left`,
    shopHowTitle: 'How to reserve',
    shopHowSubtitle: 'Three steps, takes a minute.',
    shopStep1Title: 'Pick',
    shopStep1Body: 'Your T-Shirt and size from the list above.',
    shopStep2Title: 'Message us on WhatsApp',
    shopStep2Body: 'T-Shirt, size and your name, like this:',
    shopStep2Sample: 'Halloween · L · First Last',
    shopCopyNumber: 'Copy number',
    shopCopied: 'Number copied',
    shopCopyFallback: 'Selected, copy it',
    shopStep3Title: 'Pick it up at the party',
    shopStep3Body: 'Saturday 24/10, The Sound House. Find us at the shop stand.',
    shopWhatsAppMessage: (item) =>
      `Hi! I'd like to reserve a T-Shirt to pick up at the party on 24/10:\nT-Shirt: ${item}\nSize: \nName: `,
  },
  pt: {
    dateLocale: 'pt-BR',

    navHome: 'Início',
    navEvents: 'Eventos',
    navGallery: 'Galeria',
    navPartners: 'Parceiros',
    navSocials: 'Redes',
    navBookings: 'Bookings',
    navShop: 'Shop',
    tickets: 'Ingressos',
    homeAria: 'Início da Tropical Nomads',
    openMenuAria: 'Abrir menu de navegação',
    closeMenuAria: 'Fechar menu de navegação',

    heroTagline: 'Psytrance com um toque brasileiro',
    heroDescription:
      'A Tropical Nomads é uma crew brasileira baseada na Europa, levando o calor e a energia da cena psytrance brasileira para as pistas de todo o continente. Fazemos festas por toda a Europa, unindo a comunidade em uma família psicodélica e tropical, mantendo a cultura do psytrance viva com um toque bem brasileiro.',
    exploreUpcoming: 'Explorar próximos eventos',
    exploreUpcomingAria: 'Ir para os próximos eventos',
    followJourney: 'Acompanhe nossa jornada',

    footerTagline: 'Tropical Nomads - feito para a comunidade da pista.',

    stayConnected: 'Fique por dentro',
    stayConnectedSubtitle: 'Siga a Tropical Nomads e amigos nas nossas redes.',
    noSocialLinksTitle: 'Sem redes sociais',
    noSocialLinksBody: 'Os perfis sociais aparecerão aqui.',
    openLinkAria: (label) => `Abrir ${label}`,

    partners: 'Parceiros',
    partnersSubtitle: 'As crews com quem unimos forças pela Europa.',
    noPartnersTitle: 'Ainda sem parceiros',
    noPartnersBody: 'Nossas crews parceiras aparecerão aqui.',
    openOnInstagramAria: (name) => `Abrir ${name} no Instagram`,

    upcomingEvents: 'Próximos eventos',
    upcomingEventsSubtitle: 'Todas as datas futuras, a partir da próxima.',
    noUpcomingTitle: 'Nenhum evento futuro',
    noUpcomingBody: 'Volte em breve para novas datas anunciadas.',
    nextUp: 'A seguir',
    buyTickets: 'Comprar ingressos',
    eventDetails: 'Detalhes do evento',
    comingSoon: 'Em breve',
    timetable: 'Programação',
    buyTicketsAria: (title) => `Comprar ingressos para ${title}`,
    openTimetableAria: (title) => `Abrir programação de ${title}`,
    viewOnGoabaseAria: (title) => `Ver ${title} no goabase`,
    openOnMapsAria: (place) => `Abrir ${place} no Google Maps`,

    pastEvents: 'Eventos passados',
    pastEventsSubtitle: 'Uma retrospectiva dos nossos encontros anteriores.',
    noPastTitle: 'Ainda sem eventos passados',
    noPastBody: 'Nosso histórico aparecerá aqui.',
    searchPastEvents: 'Buscar eventos passados',
    searchPastEventsPlaceholder: 'Busque por evento, cidade ou artista',
    clearSearch: 'Limpar busca',
    pastEventsResults: (shown, total) =>
      shown === total
        ? `${total} evento${total === 1 ? '' : 's'}`
        : `Mostrando ${shown} de ${total} eventos`,
    showMorePastEvents: (count) => `Mostrar mais ${count}`,
    showLessPastEvents: 'Mostrar menos',
    noPastSearchTitle: 'Nenhum evento encontrado',
    noPastSearchBody: 'Tente outro artista, cidade ou nome de evento.',
    viewDetailsAria: (title) => `Ver detalhes de ${title}`,
    openEventInstagramAria: (title) => `Abrir ${title} no Instagram`,

    close: 'Fechar',
    closeDetailsAria: 'Fechar detalhes',
    photos: 'Fotos',
    videos: 'Vídeos',
    sets: 'Sets',
    mediaComingSoon: 'Fotos e vídeos em breve.',
    viewOnGoabase: 'Ver no goabase',

    switchLanguageTo: (languageLabel) => `Mudar idioma para ${languageLabel}`,

    shopTagline: 'Shop · Tropical Nomads Halloween Special',
    shopHeadline: 'Reserva a tua camiseta e retira na festa',
    shopLead:
      'Bordado que brilha no UV, feito em Portugal. Estoque contado pra festa de sábado na Sound House. Reservou, tá guardada com teu nome.',
    shopTotal: (count) => `Só ${count} camisetas pra festa inteira`,
    shopReserveWhatsApp: 'Reservar no WhatsApp',
    shopPiecesTitle: 'Peças disponíveis',
    shopPiecesSubtitle: 'Retirada na festa de sábado, 24/10. Estoque atualizado hoje.',
    shopChipParty: 'Edição da festa',
    shopChipDrop: 'Drop 01',
    shopMetaHw: 'Bordado que brilha no UV. Tropical Nomads na frente, arte de Halloween nas costas.',
    shopMetaPg: 'Bordado que brilha no UV. Psy Groove na frente, arte nas costas.',
    shopSizes: 'Tamanhos',
    shopBookHw: 'Reservar a Halloween',
    shopBookPg: 'Reservar a Psy Groove',
    shopLeft: (count) => (count === 1 ? 'peça restante' : 'peças restantes'),
    shopLastRun: 'Última produção',
    shopMadeToOrder: 'Depois só sob encomenda',
    shopLastOne: 'última',
    shopManyLeft: (count) => `${count} restam`,
    shopHowTitle: 'Como reservar',
    shopHowSubtitle: 'Três passos, leva um minuto.',
    shopStep1Title: 'Escolhe',
    shopStep1Body: 'A peça e o teu tamanho na lista acima.',
    shopStep2Title: 'Manda no WhatsApp',
    shopStep2Body: 'Peça, tamanho e teu nome, assim:',
    shopStep2Sample: 'Halloween · G · Nome Sobrenome',
    shopCopyNumber: 'Copiar número',
    shopCopied: 'Número copiado',
    shopCopyFallback: 'Selecionado, copie',
    shopStep3Title: 'Retira na festa',
    shopStep3Body: 'Sábado 24/10, The Sound House. Procura a gente no shop.',
    shopWhatsAppMessage: (item) =>
      `Fala! Quero reservar pra retirar na festa 24/10:\nPeça: ${item}\nTamanho: \nNome: `,
  },
};
