import { type Locale, type PaymentMethodType, type WebAreaId } from 'tropical-nomads-shared';

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
  account: AccountCopy;
  payments: PaymentCopy;
}

export interface AccountCopy {
  signIn: string;
  signOut: string;
  register: string;
  registerTitle: string;
  signInTitle: string;
  accountTitle: string;
  intro: string;
  email: string;
  password: string;
  username: string;
  givenName: string;
  familyName: string;
  submitRegister: string;
  submitSignIn: string;
  continueGoogle: string;
  continueApple: string;
  billingLater: string;
  noPaymentMethod: string;
  disabled: string;
  notices: Record<AccountNotice, string>;
}

export interface PaymentCopy {
  section: string;
  billingTitle: string;
  methodTitle: string;
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  saveBilling: string;
  type: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  saveMethod: string;
  notACharge: string;
  pending: string;
  billingSaved: string;
  types: Record<PaymentMethodType, string>;
  purposes: Record<'tickets' | 'merch', string>;
  notices: Record<PaymentNotice, string>;
}

export type PaymentNotice = 'not-signed-in' | 'billing-required' | 'card-rejected' | 'billing-saved' | 'method-saved' | 'cannot-pay' | 'pending-provider';

export type AccountNotice =
  | 'username-required'
  | 'username-invalid'
  | 'username-taken'
  | 'name-required'
  | 'email-invalid'
  | 'password-short'
  | 'password-long'
  | 'password-rejected'
  | 'cognito-not-configured'
  | 'email-unconfirmed'
  | 'provider-not-allowed'
  | 'not-signed-in';

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
    payments: {
      section: 'Payment',
      billingTitle: 'Billing address',
      methodTitle: 'Payment method',
      recipientName: 'Recipient',
      line1: 'Address',
      line2: 'Address line 2',
      city: 'City',
      region: 'Region',
      postalCode: 'Postal code',
      country: 'Country',
      saveBilling: 'Save billing address',
      type: 'Type',
      brand: 'Brand',
      last4: 'Last 4 digits',
      expiryMonth: 'Expiry month',
      expiryYear: 'Expiry year',
      saveMethod: 'Save payment method',
      notACharge: 'A saved method is not a charge. Nothing is paid until a provider confirms it.',
      pending: 'Pending provider',
      billingSaved: 'Billing address saved.',
      types: { card: 'Card', apple_pay: 'Apple Pay', google_pay: 'Google Pay', other: 'Other' },
      purposes: { tickets: 'Tickets', merch: 'Merch' },
      notices: {
        'not-signed-in': 'Sign in before saving a payment method.',
        'billing-required': 'Add a billing address first.',
        'card-rejected': 'A card number is not stored.',
        'billing-saved': 'Billing address saved.',
        'method-saved': 'Payment method saved. Nothing has been charged.',
        'cannot-pay': 'This account cannot pay.',
        'pending-provider': 'The payment is pending. It is not confirmed.',
      },
    },
    account: {
      signIn: 'Sign in',
      signOut: 'Sign out',
      register: 'Create account',
      registerTitle: 'Create account',
      signInTitle: 'Sign in',
      accountTitle: 'Account',
      intro: 'Email and password, Google, or Apple. Billing can wait until a ticket.',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      givenName: 'Given name',
      familyName: 'Family name',
      submitRegister: 'Create account',
      submitSignIn: 'Sign in',
      continueGoogle: 'Continue with Google',
      continueApple: 'Continue with Apple',
      billingLater: 'A billing address is not required to create the account.',
      noPaymentMethod: 'No payment method is saved.',
      disabled: 'This account is disabled. It cannot buy or scan.',
      notices: {
        'username-required': 'Choose a username.',
        'username-invalid': 'Usernames use letters, digits, and hyphens, and cannot be an event id.',
        'username-taken': 'That username is already used.',
        'name-required': 'Enter your given name and family name.',
        'email-invalid': 'Enter an email address.',
        'password-short': 'Use at least 12 characters.',
        'password-long': 'That password is too long.',
        'password-rejected': 'Choose a different password.',
        'cognito-not-configured': 'Sign-in is not available yet. Cognito is not configured.',
        'email-unconfirmed': 'Confirm the message sent to your email, then sign in.',
        'provider-not-allowed': 'That sign-in provider is not available.',
        'not-signed-in': 'Sign in before changing the account.',
      },
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
    payments: {
      section: 'Pagamento',
      billingTitle: 'Endereço de cobrança',
      methodTitle: 'Meio de pagamento',
      recipientName: 'Destinatário',
      line1: 'Endereço',
      line2: 'Complemento',
      city: 'Cidade',
      region: 'Região',
      postalCode: 'Código postal',
      country: 'País',
      saveBilling: 'Salvar endereço',
      type: 'Tipo',
      brand: 'Bandeira',
      last4: 'Últimos 4 dígitos',
      expiryMonth: 'Mês de validade',
      expiryYear: 'Ano de validade',
      saveMethod: 'Salvar meio de pagamento',
      notACharge: 'Um meio salvo não é uma cobrança. Nada é pago até um provedor confirmar.',
      pending: 'Pendente do provedor',
      billingSaved: 'Endereço de cobrança salvo.',
      types: { card: 'Cartão', apple_pay: 'Apple Pay', google_pay: 'Google Pay', other: 'Outro' },
      purposes: { tickets: 'Ingressos', merch: 'Merch' },
      notices: {
        'not-signed-in': 'Entre antes de salvar um meio de pagamento.',
        'billing-required': 'Adicione um endereço de cobrança primeiro.',
        'card-rejected': 'Um número de cartão não é guardado.',
        'billing-saved': 'Endereço de cobrança salvo.',
        'method-saved': 'Meio de pagamento salvo. Nada foi cobrado.',
        'cannot-pay': 'Esta conta não pode pagar.',
        'pending-provider': 'O pagamento está pendente. Ele não foi confirmado.',
      },
    },
    account: {
      signIn: 'Entrar',
      signOut: 'Sair',
      register: 'Criar conta',
      registerTitle: 'Criar conta',
      signInTitle: 'Entrar',
      accountTitle: 'Conta',
      intro: 'E-mail e senha, Google ou Apple. O endereço de cobrança pode esperar.',
      email: 'E-mail',
      password: 'Senha',
      username: 'Nome de usuário',
      givenName: 'Nome',
      familyName: 'Apelido',
      submitRegister: 'Criar conta',
      submitSignIn: 'Entrar',
      continueGoogle: 'Continuar com Google',
      continueApple: 'Continuar com Apple',
      billingLater: 'O endereço de cobrança não é obrigatório para criar a conta.',
      noPaymentMethod: 'Nenhum meio de pagamento foi salvo.',
      disabled: 'Esta conta está desativada. Ela não pode comprar nem fazer a leitura.',
      notices: {
        'username-required': 'Escolha um nome de usuário.',
        'username-invalid': 'Use letras, números e hífens. O nome não pode ser o id de um evento.',
        'username-taken': 'Esse nome de usuário já está em uso.',
        'name-required': 'Informe o nome e o apelido.',
        'email-invalid': 'Informe um e-mail.',
        'password-short': 'Use pelo menos 12 caracteres.',
        'password-long': 'Essa senha é longa demais.',
        'password-rejected': 'Escolha outra senha.',
        'cognito-not-configured': 'A entrada ainda não está disponível. O Cognito não está configurado.',
        'email-unconfirmed': 'Confirme a mensagem enviada ao seu e-mail e depois entre.',
        'provider-not-allowed': 'Esse provedor de entrada não está disponível.',
        'not-signed-in': 'Entre antes de alterar a conta.',
      },
    },
  },
};

export function presentText(language: Locale, key: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`missing translation ${language}.${key}`);
  }
  return value;
}

export function shellText<K extends keyof Omit<ShellCopy, 'areas' | 'areaDescriptions' | 'events' | 'account' | 'payments'>>(
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

export function accountText<K extends keyof Omit<AccountCopy, 'notices'>>(language: Locale, key: K): string {
  return presentText(language, `account.${key}`, shellCopy[language].account[key]);
}

export function accountNotice(language: Locale, notice: AccountNotice): string {
  return presentText(language, `account.${notice}`, shellCopy[language].account.notices[notice]);
}

export function paymentText<K extends keyof Omit<PaymentCopy, 'notices' | 'types' | 'purposes'>>(language: Locale, key: K): string {
  return presentText(language, `payments.${key}`, shellCopy[language].payments[key]);
}

export function paymentNotice(language: Locale, notice: PaymentNotice): string {
  return presentText(language, `payments.${notice}`, shellCopy[language].payments.notices[notice]);
}

export function paymentTypeLabel(language: Locale, type: PaymentMethodType): string {
  return presentText(language, `payments.type.${type}`, shellCopy[language].payments.types[type]);
}

export function paymentPurposeLabel(language: Locale, purpose: 'tickets' | 'merch'): string {
  return presentText(language, `payments.purpose.${purpose}`, shellCopy[language].payments.purposes[purpose]);
}

export function switchLanguageLabel(language: Locale, option: string): string {
  return shellText(language, 'switchLanguage').replaceAll('{label}', option);
}
