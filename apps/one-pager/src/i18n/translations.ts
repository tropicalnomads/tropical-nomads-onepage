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
  navMerch: string;
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

  // Merch
  merchTagline: string;
  merchHeadline: string;
  merchLead: string;
  merchTotal: (count: number) => string;
  merchReserveWhatsApp: string;
  merchPiecesTitle: string;
  merchPiecesSubtitle: string;
  merchChipParty: string;
  merchChipDrop: string;
  merchMetaHw: string;
  merchMetaPg: string;
  merchSizes: string;
  merchBookHw: string;
  merchBookPg: string;
  merchLeft: (count: number) => string;
  merchLastRun: string;
  merchMadeToOrder: string;
  merchLastOne: string;
  merchManyLeft: (count: number) => string;
  merchHowTitle: string;
  merchHowSubtitle: string;
  merchStep1Title: string;
  merchStep1Body: string;
  merchStep2Title: string;
  merchStep2Body: string;
  merchStep2Sample: string;
  merchCopyNumber: string;
  merchCopied: string;
  merchCopyFallback: string;
  merchStep3Title: string;
  merchStep3Body: string;
  merchWhatsAppMessage: (item: string) => string;
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
    navMerch: 'Shop',
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

    merchTagline: 'Shop · Tropical Groove Halloween',
    merchHeadline: 'Reserve your T-Shirt, pick it up at the party',
    merchLead:
      "UV-reactive embroidery, made in Portugal. Limited stock for Saturday's party at The Sound House. Reserve it and it's held under your name.",
    merchTotal: (count) => `Only ${count} T-Shirts for the whole party`,
    merchReserveWhatsApp: 'Reserve on WhatsApp',
    merchPiecesTitle: 'Available T-Shirts',
    merchPiecesSubtitle: 'Pick up at the party, Saturday 24/10. Stock updated today.',
    merchChipParty: 'Party edition',
    merchChipDrop: 'Drop 01',
    merchMetaHw: 'Embroidered T-Shirt · glows under UV',
    merchMetaPg: 'Embroidered T-Shirt · logo front, artwork back',
    merchSizes: 'Sizes',
    merchBookHw: 'Reserve the Halloween T-Shirt',
    merchBookPg: 'Reserve the Psy Groove T-Shirt',
    merchLeft: (count) => (count === 1 ? 'T-Shirt left' : 'T-Shirts left'),
    merchLastRun: 'Last production run',
    merchMadeToOrder: 'Then made to order only',
    merchLastOne: 'last one',
    merchManyLeft: (count) => `${count} left`,
    merchHowTitle: 'How to reserve',
    merchHowSubtitle: 'Three steps, takes a minute.',
    merchStep1Title: 'Pick',
    merchStep1Body: 'Your T-Shirt and size from the list above.',
    merchStep2Title: 'Message us on WhatsApp',
    merchStep2Body: 'T-Shirt, size and your name, like this:',
    merchStep2Sample: 'Halloween · L · First Last',
    merchCopyNumber: 'Copy number',
    merchCopied: 'Number copied',
    merchCopyFallback: 'Selected, copy it',
    merchStep3Title: 'Pick it up at the party',
    merchStep3Body: 'Saturday 24/10, The Sound House. Find us at the merch stand.',
    merchWhatsAppMessage: (item) =>
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
    navMerch: 'Merch',
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

    merchTagline: 'Merch · Tropical Groove Halloween',
    merchHeadline: 'Reserva a tua camiseta e retira na festa',
    merchLead:
      'Bordado que brilha no UV, feito em Portugal. Estoque contado pra festa de sábado na Sound House. Reservou, tá guardada com teu nome.',
    merchTotal: (count) => `Só ${count} camisetas pra festa inteira`,
    merchReserveWhatsApp: 'Reservar no WhatsApp',
    merchPiecesTitle: 'Peças disponíveis',
    merchPiecesSubtitle: 'Retirada na festa de sábado, 24/10. Estoque atualizado hoje.',
    merchChipParty: 'Edição da festa',
    merchChipDrop: 'Drop 01',
    merchMetaHw: 'Camiseta bordada · brilha no UV',
    merchMetaPg: 'Camiseta bordada · logo na frente, arte nas costas',
    merchSizes: 'Tamanhos',
    merchBookHw: 'Reservar a Halloween',
    merchBookPg: 'Reservar a Psy Groove',
    merchLeft: (count) => (count === 1 ? 'peça restante' : 'peças restantes'),
    merchLastRun: 'Última produção',
    merchMadeToOrder: 'Depois só sob encomenda',
    merchLastOne: 'última',
    merchManyLeft: (count) => `${count} restam`,
    merchHowTitle: 'Como reservar',
    merchHowSubtitle: 'Três passos, leva um minuto.',
    merchStep1Title: 'Escolhe',
    merchStep1Body: 'A peça e o teu tamanho na lista acima.',
    merchStep2Title: 'Manda no WhatsApp',
    merchStep2Body: 'Peça, tamanho e teu nome, assim:',
    merchStep2Sample: 'Halloween · G · Nome Sobrenome',
    merchCopyNumber: 'Copiar número',
    merchCopied: 'Número copiado',
    merchCopyFallback: 'Selecionado, copie',
    merchStep3Title: 'Retira na festa',
    merchStep3Body: 'Sábado 24/10, The Sound House. Procura a gente no merch.',
    merchWhatsAppMessage: (item) =>
      `Fala! Quero reservar pra retirar na festa 24/10:\nPeça: ${item}\nTamanho: \nNome: `,
  },
};
