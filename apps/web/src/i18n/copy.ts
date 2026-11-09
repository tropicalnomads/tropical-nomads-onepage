import { type Locale, type PaymentMethodType, type WebAreaId } from 'tropical-nomads-shared';
import { homeCopy, type HomeCopy } from './home.ts';

export interface ShellCopy {
  homeAria: string;
  openMenu: string;
  closeMenu: string;
  primary: string;
  primaryMobile: string;
  footer: string;
  tagline: string;
  footerTagline: string;
  home: HomeCopy;
  privacy: string;
  switchLanguage: string;
  areas: Record<WebAreaId, string>;
  areaDescriptions: Record<WebAreaId, string>;
  events: EventCopy;
  tickets: TicketCopy;
  checkIn: CheckInCopy;
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
  avatarTitle: string;
  avatarHelp: string;
  saveAvatar: string;
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
  teamTitle: string;
  teamEmpty: string;
  unknownAccount: string;
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
  | 'not-signed-in'
  | 'avatar-rejected'
  | 'avatar-saved';

const accountNotices: readonly AccountNotice[] = [
  'username-required',
  'username-invalid',
  'username-taken',
  'name-required',
  'email-invalid',
  'password-short',
  'password-long',
  'password-rejected',
  'cognito-not-configured',
  'email-unconfirmed',
  'provider-not-allowed',
  'not-signed-in',
  'avatar-rejected',
  'avatar-saved',
];

export function knownAccountNotice(value: string | undefined): AccountNotice | null {
  if (!value) {
    return null;
  }
  for (const notice of accountNotices) {
    if (notice === value) {
      return notice;
    }
  }
  return null;
}

export interface EventCopy {
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  nextUp: string;
  buyTickets: string;
  buyTicketsAria: string;
  buyInApp: string;
  buyInAppAria: string;
  inAppNote: string;
  viewTickets: string;
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

export interface TicketCopy {
  signInTitle: string;
  signInBody: string;
  emptyTitle: string;
  emptyBody: string;
  unpaid: string;
  notValid: string;
  open: string;
  back: string;
  qrLabel: string;
}

export interface CheckInCopy {
  signInTitle: string;
  signInBody: string;
  deniedTitle: string;
  deniedBody: string;
  chooseEvent: string;
  searchLabel: string;
  searchButton: string;
  soldTitle: string;
  guestsTitle: string;
  unpaid: string;
  checked: string;
  ready: string;
  checkIn: string;
  scan: string;
  cameraBlocked: string;
  chooseImage: string;
  admitted: string;
  refused: string;
  alreadyUsed: string;
  wrongParty: string;
  unknown: string;
  listName: string;
  guestName: string;
  createList: string;
  addGuest: string;
  noPeople: string;
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
    footerTagline: 'Tropical Nomads - made for the dancefloor community.',
    home: homeCopy.en,
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
      'my-tickets': 'Your tickets and the QR code for the door. An unpaid ticket is not valid for entry.',
      'check-in': 'Door staff and admins check in a published event. A checked person cannot enter again.',
      merch: 'The shop is not open in this shell.',
    },
    events: {
      subtitle: 'The next parties. A party with a euro offer can be bought here. The others keep their seller link.',
      emptyTitle: 'No upcoming events',
      emptyBody: 'Check back soon for newly announced dates.',
      nextUp: 'Next up',
      buyTickets: 'Buy tickets',
      buyTicketsAria: 'Buy tickets for {title} on the seller site',
      buyInApp: 'Buy ticket',
      buyInAppAria: 'Buy a euro ticket for {title}. Payment is not confirmed.',
      inAppNote: 'The amount is in euro. Nothing is charged until a provider confirms it.',
      viewTickets: 'View my tickets',
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
    tickets: {
      signInTitle: 'Sign in to see your tickets',
      signInBody: 'Tickets stay on your account. The QR code is not on this page until you sign in.',
      emptyTitle: 'No tickets yet',
      emptyBody: 'A ticket you buy for a published party will show up here.',
      unpaid: 'Payment is not confirmed.',
      notValid: 'This ticket is not valid for entry.',
      open: 'Open ticket',
      back: 'All tickets',
      qrLabel: 'QR code for {title}',
    },
    checkIn: {
      signInTitle: 'Sign in to check in',
      signInBody: 'Check-in is for door staff and admins.',
      deniedTitle: 'Check-in is closed',
      deniedBody: 'A buyer cannot open this page.',
      chooseEvent: 'Choose an event',
      searchLabel: 'Search by name',
      searchButton: 'Search',
      soldTitle: 'Tickets sold',
      guestsTitle: 'Guest list',
      unpaid: 'Unpaid',
      checked: 'Checked',
      ready: 'Not checked',
      checkIn: 'Check in',
      scan: 'Scan QR code',
      cameraBlocked: 'The camera is not available. Choose an image of the code instead.',
      chooseImage: 'Choose an image',
      admitted: 'Checked in.',
      refused: 'Not admitted.',
      alreadyUsed: 'Already checked in.',
      wrongParty: 'Wrong event.',
      unknown: 'Code not recognized.',
      listName: 'List name',
      guestName: 'Person name',
      createList: 'Create guest list',
      addGuest: 'Add person',
      noPeople: 'No one matches that name.',
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
      teamTitle: 'All payment traces',
      teamEmpty: 'No payment traces.',
      unknownAccount: 'Unknown account',
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
      avatarTitle: 'Profile photo',
      avatarHelp: 'JPEG, PNG, or WebP. At most 1 MB.',
      saveAvatar: 'Save photo',
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
        'avatar-rejected': 'That photo was not saved.',
        'avatar-saved': 'Profile photo saved.',
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
    footerTagline: 'Tropical Nomads - feito para a comunidade da pista.',
    home: homeCopy.pt,
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
      'my-tickets': 'Os seus ingressos e o QR da porta. Um ingresso não pago não vale para entrar.',
      'check-in': 'A porta e os admins fazem o check-in de uma festa publicada. Quem já entrou não entra de novo.',
      merch: 'A loja não está aberta neste app.',
    },
    events: {
      subtitle: 'As próximas festas. Uma festa com oferta em euro pode ser comprada aqui. As outras mantêm o link do vendedor.',
      emptyTitle: 'Nenhum evento futuro',
      emptyBody: 'Volte em breve para novas datas anunciadas.',
      nextUp: 'A seguir',
      buyTickets: 'Comprar ingressos',
      buyTicketsAria: 'Comprar ingressos para {title} no site do vendedor',
      buyInApp: 'Comprar ingresso',
      buyInAppAria: 'Comprar um ingresso em euro para {title}. O pagamento não está confirmado.',
      inAppNote: 'O valor é em euro. Nada é cobrado até um provedor confirmar.',
      viewTickets: 'Ver meus ingressos',
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
    tickets: {
      signInTitle: 'Entre para ver seus ingressos',
      signInBody: 'Os ingressos ficam na sua conta. O QR não aparece nesta página antes de entrar.',
      emptyTitle: 'Nenhum ingresso ainda',
      emptyBody: 'Um ingresso comprado para uma festa publicada aparece aqui.',
      unpaid: 'O pagamento não está confirmado.',
      notValid: 'Este ingresso não vale para entrar.',
      open: 'Abrir ingresso',
      back: 'Todos os ingressos',
      qrLabel: 'QR de {title}',
    },
    checkIn: {
      signInTitle: 'Entre para fazer o check-in',
      signInBody: 'O check-in é para a equipe da porta e para admins.',
      deniedTitle: 'Check-in fechado',
      deniedBody: 'Quem comprou o ingresso não abre esta página.',
      chooseEvent: 'Escolha um evento',
      searchLabel: 'Buscar por nome',
      searchButton: 'Buscar',
      soldTitle: 'Ingressos vendidos',
      guestsTitle: 'Lista de convidados',
      unpaid: 'Não pago',
      checked: 'Check-in feito',
      ready: 'Sem check-in',
      checkIn: 'Fazer check-in',
      scan: 'Ler QR code',
      cameraBlocked: 'A câmera não está disponível. Escolha uma imagem do código.',
      chooseImage: 'Escolher imagem',
      admitted: 'Check-in feito.',
      refused: 'Não entrou.',
      alreadyUsed: 'Já fez check-in.',
      wrongParty: 'Evento errado.',
      unknown: 'Código não reconhecido.',
      listName: 'Nome da lista',
      guestName: 'Nome da pessoa',
      createList: 'Criar lista de convidados',
      addGuest: 'Adicionar pessoa',
      noPeople: 'Ninguém com esse nome.',
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
      teamTitle: 'Todos os pagamentos',
      teamEmpty: 'Nenhum pagamento registrado.',
      unknownAccount: 'Conta desconhecida',
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
      avatarTitle: 'Foto do perfil',
      avatarHelp: 'JPEG, PNG ou WebP. No máximo 1 MB.',
      saveAvatar: 'Salvar foto',
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
        'avatar-rejected': 'Essa foto não foi salva.',
        'avatar-saved': 'Foto do perfil salva.',
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

export function shellText<K extends keyof Omit<ShellCopy, 'areas' | 'areaDescriptions' | 'events' | 'tickets' | 'checkIn' | 'account' | 'payments' | 'home'>>(
  language: Locale,
  key: K,
): string {
  return presentText(language, key, shellCopy[language][key]);
}

export function homeText<K extends keyof HomeCopy>(language: Locale, key: K): string {
  return presentText(language, `home.${key}`, shellCopy[language].home[key]);
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

export function ticketText<K extends keyof TicketCopy>(language: Locale, key: K): string {
  return presentText(language, `tickets.${key}`, shellCopy[language].tickets[key]);
}

export function checkInText<K extends keyof CheckInCopy>(language: Locale, key: K): string {
  return presentText(language, `checkIn.${key}`, shellCopy[language].checkIn[key]);
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
