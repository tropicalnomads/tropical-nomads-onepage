import { type Locale, type WebAreaId } from 'tropical-nomads-shared';

export interface ShellCopy {
  homeAria: string;
  openMenu: string;
  closeMenu: string;
  primary: string;
  primaryMobile: string;
  footer: string;
  tagline: string;
  intro: string;
  footerTagline: string;
  privacy: string;
  switchLanguage: string;
  areas: Record<WebAreaId, string>;
  areaDescriptions: Record<WebAreaId, string>;
  events: EventCopy;
}

export interface EventCopy {
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  nextUp: string;
  buyTickets: string;
  buyTicketsAria: string;
  eventDetails: string;
  eventDetailsAria: string;
  comingSoon: string;
  timetable: string;
  timetableAria: string;
  mapsAria: string;
  partnerAria: string;
  flyerAlt: string;
  dateLocale: string;
}

export const shellCopy: Record<Locale, ShellCopy> = {
  en: {
    homeAria: 'Tropical Nomads home',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    primary: 'Primary',
    primaryMobile: 'Primary mobile',
    footer: 'Footer',
    tagline: 'Psytrance with a Brazilian touch',
    intro: 'The same parties, tickets, door, and shop. Nothing here is on sale yet.',
    footerTagline: 'Tropical Nomads - made for the dancefloor community.',
    privacy: 'Privacy Policy',
    switchLanguage: 'Switch language to {label}',
    areas: {
      'upcoming-events': 'Upcoming events',
      'my-tickets': 'My tickets',
      'check-in': 'Check-in',
      merch: 'Merch',
    },
    areaDescriptions: {
      'upcoming-events': 'Published parties, with the date, the place, and who is playing.',
      'my-tickets': 'Tickets are not listed in this shell.',
      'check-in': 'Door check-in is not active in this shell. There is no scanner and no ticket entry.',
      merch: 'The shop is not open in this shell.',
    },
    events: {
      subtitle: 'The next parties. Ticket links leave this app.',
      emptyTitle: 'No upcoming events',
      emptyBody: 'Check back soon for newly announced dates.',
      nextUp: 'Next up',
      buyTickets: 'Buy tickets',
      buyTicketsAria: 'Buy tickets for {title} on the seller site',
      eventDetails: 'Event details',
      eventDetailsAria: 'Open event details for {title}',
      comingSoon: 'Coming soon',
      timetable: 'Timetable',
      timetableAria: 'Open timetable for {title}',
      mapsAria: 'Open {place} on maps',
      partnerAria: 'Open {name} on Instagram',
      flyerAlt: '{title} flyer',
      dateLocale: 'en',
    },
  },
  pt: {
    homeAria: 'Início da Tropical Nomads',
    openMenu: 'Abrir menu de navegação',
    closeMenu: 'Fechar menu de navegação',
    primary: 'Principal',
    primaryMobile: 'Principal no celular',
    footer: 'Rodapé',
    tagline: 'Psytrance com um toque brasileiro',
    intro: 'As mesmas festas, ingressos, porta e loja. Nada aqui está à venda ainda.',
    footerTagline: 'Tropical Nomads - feito para a comunidade da pista.',
    privacy: 'Política de privacidade',
    switchLanguage: 'Mudar idioma para {label}',
    areas: {
      'upcoming-events': 'Próximos eventos',
      'my-tickets': 'Meus ingressos',
      'check-in': 'Check-in',
      merch: 'Merch',
    },
    areaDescriptions: {
      'upcoming-events': 'Festas publicadas, com a data, o lugar e quem toca.',
      'my-tickets': 'Os ingressos não estão listados neste app.',
      'check-in': 'O check-in da porta não está ativo neste app. Não há leitor e não há entrada de ingresso.',
      merch: 'A loja não está aberta neste app.',
    },
    events: {
      subtitle: 'As próximas festas. Os links de ingresso saem deste app.',
      emptyTitle: 'Nenhum evento futuro',
      emptyBody: 'Volte em breve para novas datas anunciadas.',
      nextUp: 'A seguir',
      buyTickets: 'Comprar ingressos',
      buyTicketsAria: 'Comprar ingressos para {title} no site do vendedor',
      eventDetails: 'Detalhes do evento',
      eventDetailsAria: 'Abrir detalhes de {title}',
      comingSoon: 'Em breve',
      timetable: 'Programação',
      timetableAria: 'Abrir a programação de {title}',
      mapsAria: 'Abrir {place} no mapa',
      partnerAria: 'Abrir {name} no Instagram',
      flyerAlt: 'Cartaz de {title}',
      dateLocale: 'pt-BR',
    },
  },
};

export function presentText(language: Locale, key: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`missing translation ${language}.${key}`);
  }
  return value;
}

export function shellText<K extends keyof Omit<ShellCopy, 'areas' | 'areaDescriptions' | 'events'>>(
  language: Locale,
  key: K,
): string {
  return presentText(language, key, shellCopy[language][key]);
}

export function areaText(language: Locale, id: WebAreaId): string {
  return presentText(language, id, shellCopy[language].areas[id]);
}

export function areaDescription(language: Locale, id: WebAreaId): string {
  return presentText(language, `${id}.description`, shellCopy[language].areaDescriptions[id]);
}

export function eventText<K extends keyof EventCopy>(language: Locale, key: K): string {
  return presentText(language, `events.${key}`, shellCopy[language].events[key]);
}

export function switchLanguageLabel(language: Locale, option: string): string {
  return shellText(language, 'switchLanguage').replaceAll('{label}', option);
}
