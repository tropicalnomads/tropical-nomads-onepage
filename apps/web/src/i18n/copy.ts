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
      'upcoming-events': 'Events are not loaded in this shell.',
      'my-tickets': 'Tickets are not listed in this shell.',
      'check-in': 'Door check-in is not active in this shell. There is no scanner and no ticket entry.',
      merch: 'The shop is not open in this shell.',
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
      'upcoming-events': 'Os eventos não estão carregados neste app.',
      'my-tickets': 'Os ingressos não estão listados neste app.',
      'check-in': 'O check-in da porta não está ativo neste app. Não há leitor e não há entrada de ingresso.',
      merch: 'A loja não está aberta neste app.',
    },
  },
};

export function presentText(language: Locale, key: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`missing translation ${language}.${key}`);
  }
  return value;
}

export function shellText<K extends keyof Omit<ShellCopy, 'areas' | 'areaDescriptions'>>(
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

export function switchLanguageLabel(language: Locale, option: string): string {
  return shellText(language, 'switchLanguage').replaceAll('{label}', option);
}
