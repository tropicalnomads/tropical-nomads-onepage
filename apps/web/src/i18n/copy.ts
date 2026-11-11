import { type Locale, type PaymentMethodType, type WebAreaId } from 'tropical-nomads-shared';
import { homeCopy, type HomeCopy } from './home.ts';

export interface ShellCopy {
  homeAria: string;
  navHome: string;
  navBookings: string;
  calendar: string;
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
  eventsAdmin: string;
  checkIn: CheckInCopy;
  account: AccountCopy;
  payments: PaymentCopy;
  admin: AdminCopy;
}

export interface AccountCopy {
  signIn: string;
  signOut: string;
  register: string;
  registerTitle: string;
  signInTitle: string;
  signInSubtitle: string;
  registerSubtitle: string;
  accountTitle: string;
  intro: string;
  joinCommunity: string;
  accountRecovery: string;
  email: string;
  password: string;
  confirmPassword: string;
  passwordRuleLength: string;
  passwordRuleUpper: string;
  passwordRuleLower: string;
  passwordRuleNumber: string;
  passwordRuleSymbol: string;
  strengthWeak: string;
  strengthFair: string;
  strengthGood: string;
  strengthStrong: string;
  profileTitle: string;
  profileHelp: string;
  profileDetailsTitle: string;
  profileDetailsHelp: string;
  required: string;
  saveProfile: string;
  username: string;
  givenName: string;
  familyName: string;
  displayName: string;
  phone: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  submitRegister: string;
  submitSignIn: string;
  confirmAccount: string;
  finishProfile: string;
  working: string;
  orContinueWith: string;
  showPassword: string;
  hidePassword: string;
  alreadyHaveAccount: string;
  newToTropical: string;
  confirmationTitle: string;
  confirmSubtitle: string;
  confirmAskTitle: string;
  confirmAskSubtitle: string;
  continueConfirm: string;
  resendCode: string;
  differentEmail: string;
  haveCode: string;
  enterCode: string;
  forgotPassword: string;
  forgotTitle: string;
  resetHelp: string;
  confirmationCode: string;
  newPassword: string;
  sendCode: string;
  submitReset: string;
  confirmHelp: string;
  continueGoogle: string;
  continueApple: string;
  noPaymentMethod: string;
  disabled: string;
  avatarTitle: string;
  avatarHelp: string;
  avatarChoose: string;
  avatarRatio: string;
  avatarRemove: string;
  avatarEmpty: string;
  avatarPlaceholder: string;
  avatarReplace: string;
  avatarInvalid: string;
  avatarCropTitle: string;
  avatarCropHelp: string;
  avatarCancel: string;
  avatarZoom: string;
  avatarCropping: string;
  avatarUse: string;
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
  purposes: Record<'tickets' | 'shop', string>;
  notices: Record<PaymentNotice, string>;
}

export type PaymentNotice =
  | 'not-signed-in'
  | 'billing-required'
  | 'card-rejected'
  | 'billing-saved'
  | 'method-saved'
  | 'cannot-pay'
  | 'pending-provider'
  | 'ticket-ready'
  | 'sold-out';

export interface AdminCopy {
  title: string;
  deniedTitle: string;
  deniedBody: string;
  newEvent: string;
  editEvent: string;
  save: string;
  publish: string;
  draft: string;
  published: string;
  ended: string;
  comingUp: string;
  endedSection: string;
  statusCount: string;
  ticketType: string;
  ticketTypes: string;
  ticketFrom: string;
  ticketCapacity: string;
  titleLabel: string;
  start: string;
  end: string;
  timezone: string;
  venue: string;
  city: string;
  description: string;
  image: string;
  artists: string;
  offers: string;
  offerName: string;
  price: string;
  capacity: string;
  addOffer: string;
  saved: string;
  invalid: string;
  back: string;
  empty: string;
  detailsTab: string;
  ticketsTab: string;
  flyer: string;
  flyerRatio: string;
  removeImage: string;
  uploadImage: string;
  replaceImage: string;
  noImage: string;
  imagePlaceholder: string;
  imageInvalid: string;
  imageHelp: string;
  cropImage: string;
  cropHelp: string;
  zoom: string;
  cancel: string;
  useImage: string;
  croppingImage: string;
  eventDetails: string;
  detailsHelp: string;
  when: string;
  date: string;
  time: string;
  place: string;
  lineup: string;
  lineupHelp: string;
  lineupSearch: string;
  lineupEmpty: string;
  addName: string;
  editArtist: string;
  artistProfile: string;
  artistBio: string;
  soundcloud: string;
  instagram: string;
  website: string;
  saveArtist: string;
  artistSaved: string;
  artistInvalid: string;
  artistName: string;
  artistPhoto: string;
  artistPhotoRatio: string;
  artistNoPhoto: string;
  artistPhotoPlaceholder: string;
  artistPhotoHelp: string;
  artistCrop: string;
  artistCropHelp: string;
  openArtist: string;
  noArtists: string;
  ticketLadder: string;
  ticketHelp: string;
  addType: string;
  typeName: string;
  addLote: string;
  loteName: string;
  loteEnds: string;
  moveUp: string;
  moveDown: string;
  removeLote: string;
  onSale: string;
  scheduled: string;
  soldOut: string;
  loteEnded: string;
  preview: string;
  boldText: string;
  italicText: string;
  markdownHelp: string;
  saving: string;
  country: string;
  genres: string;
}

export type AccountNotice =
  | 'username-required'
  | 'username-invalid'
  | 'username-taken'
  | 'name-required'
  | 'email-invalid'
  | 'password-short'
  | 'password-long'
  | 'password-uppercase'
  | 'password-lowercase'
  | 'password-number'
  | 'password-symbol'
  | 'password-mismatch'
  | 'password-rejected'
  | 'cognito-not-configured'
  | 'email-unconfirmed'
  | 'account-confirmed'
  | 'code-sent'
  | 'code-limited'
  | 'code-invalid'
  | 'reset-sent'
  | 'password-reset'
  | 'provider-not-allowed'
  | 'not-signed-in'
  | 'avatar-rejected'
  | 'avatar-too-large'
  | 'avatar-saved'
  | 'profile-invalid'
  | 'profile-saved'
  | 'profile-save-failed'
  | 'sign-in-failed';

const accountNotices: readonly AccountNotice[] = [
  'username-required',
  'username-invalid',
  'username-taken',
  'name-required',
  'email-invalid',
  'password-short',
  'password-long',
  'password-uppercase',
  'password-lowercase',
  'password-number',
  'password-symbol',
  'password-mismatch',
  'password-rejected',
  'cognito-not-configured',
  'email-unconfirmed',
  'account-confirmed',
  'code-sent',
  'code-limited',
  'code-invalid',
  'reset-sent',
  'password-reset',
  'provider-not-allowed',
  'not-signed-in',
  'avatar-rejected',
  'avatar-too-large',
  'avatar-saved',
  'profile-invalid',
  'profile-saved',
  'profile-save-failed',
  'sign-in-failed',
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
  capacityLabel: string;
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
  ready: string;
  notCharged: string;
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
  admittedName: string;
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
    navHome: 'Home',
    navBookings: 'Bookings',
    calendar: 'Calendar',
    eventsAdmin: 'Events',
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
      shop: 'Shop',
    },
    areaDescriptions: {
      'upcoming-events': 'Published parties, with the date, the place, and who is playing.',
      'my-tickets': 'Your tickets and the QR code for the door.',
      'check-in': 'Door staff and admins check in a published event. A checked person cannot enter again.',
      shop: 'Embroidered T-shirts. Buy saves the order and sends it on WhatsApp. Nothing is charged here.',
    },
    events: {
      subtitle: 'All future dates, sorted from the next one.',
      emptyTitle: 'No upcoming events',
      emptyBody: 'Check back soon for newly announced dates.',
      nextUp: 'Next up',
      buyTickets: 'Buy tickets',
      buyTicketsAria: 'Buy tickets for {title} on the seller site',
      buyInApp: 'Buy ticket',
      buyInAppAria: 'Buy a euro ticket for {title}.',
      inAppNote: 'The amount is in euro. No card is charged yet. The ticket is ready for entry.',
      capacityLabel: '{count} available',
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
      ready: 'This ticket is ready for entry.',
      notCharged: 'No card is charged yet.',
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
      admittedName: 'Checked in. {name}',
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
      purposes: { tickets: 'Tickets', shop: 'Shop' },
      notices: {
        'not-signed-in': 'Sign in before saving a payment method.',
        'billing-required': 'Add a billing address first.',
        'card-rejected': 'A card number is not stored.',
        'billing-saved': 'Billing address saved.',
        'method-saved': 'Payment method saved. Nothing has been charged.',
        'cannot-pay': 'This account cannot pay.',
        'pending-provider': 'The payment is pending. It is not confirmed.',
        'ticket-ready': 'Your ticket is ready.',
        'sold-out': 'That ticket is sold out.',
      },
    },
    account: {
      signIn: 'Sign in',
      signOut: 'Sign out',
      register: 'Create account',
      registerTitle: 'Create account',
      signInTitle: 'Sign in',
      signInSubtitle: 'Welcome back. Your tickets, profile, and event access are waiting.',
      registerSubtitle: 'Join the Tropical Nomads community and keep everything for the dancefloor in one place.',
      accountTitle: 'Account',
      intro: 'Keep your details current so tickets, orders, and event access are easier.',
      joinCommunity: 'Join the community',
      accountRecovery: 'Account recovery',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      passwordRuleLength: 'At least 8 characters',
      passwordRuleUpper: 'One uppercase letter',
      passwordRuleLower: 'One lowercase letter',
      passwordRuleNumber: 'One number',
      passwordRuleSymbol: 'One symbol',
      strengthWeak: 'Weak',
      strengthFair: 'Fair',
      strengthGood: 'Good',
      strengthStrong: 'Strong',
      profileTitle: 'Set up your profile',
      profileHelp: 'Tell us what you would like to share. Only your given name and family name are required.',
      profileDetailsTitle: 'Your profile',
      profileDetailsHelp: 'These details can be reused for tickets, orders, and future checkouts.',
      required: 'Required',
      saveProfile: 'Save profile',
      username: 'Username',
      givenName: 'Given name',
      familyName: 'Family name',
      displayName: 'Display name',
      phone: 'Phone with country code',
      city: 'City',
      region: 'State / region',
      postalCode: 'Postal code',
      country: 'Country',
      submitRegister: 'Create account',
      submitSignIn: 'Sign in',
      confirmAccount: 'Confirm and continue',
      finishProfile: 'Finish profile',
      working: 'Please wait…',
      orContinueWith: 'Or continue with',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      alreadyHaveAccount: 'Already part of the community?',
      newToTropical: 'New to Tropical Nomads?',
      confirmationTitle: 'Check your inbox',
      confirmSubtitle: 'We sent a code to {email}. You can leave this page and open it again.',
      confirmAskTitle: 'Confirm your email',
      confirmAskSubtitle: 'Use the address from the account you created. Coming back to this page keeps you on the code step.',
      continueConfirm: 'Continue',
      resendCode: 'Resend code',
      differentEmail: 'Use a different email',
      haveCode: 'Have a confirmation code?',
      enterCode: 'Enter it',
      forgotPassword: 'Forgot password',
      forgotTitle: 'Reset password',
      resetHelp: 'We email a code. The new password stays in Cognito.',
      confirmationCode: 'Confirmation code',
      newPassword: 'New password',
      sendCode: 'Send code',
      submitReset: 'Save new password',
      confirmHelp: 'Enter the code from your email. After it is accepted, sign in with the password you chose.',
      continueGoogle: 'Continue with Google',
      continueApple: 'Continue with Apple',
      noPaymentMethod: 'No payment method is saved.',
      disabled: 'This account is disabled. It cannot buy or scan.',
      avatarTitle: 'Profile photo',
      avatarHelp: 'Drag and zoom until the photo fills the square. Saved photos stay under 5 MB.',
      avatarChoose: 'Choose photo',
      avatarRatio: 'Square',
      avatarRemove: 'Remove',
      avatarEmpty: 'No photo yet',
      avatarPlaceholder: 'JPG, PNG, or WebP up to 5 MB.',
      avatarReplace: 'Replace photo',
      avatarInvalid: 'Use a JPEG, PNG, or WebP up to 5 MB.',
      avatarCropTitle: 'Crop photo',
      avatarCropHelp: 'Drag and zoom until the photo fills the frame.',
      avatarCancel: 'Cancel',
      avatarZoom: 'Zoom',
      avatarCropping: 'Cropping…',
      avatarUse: 'Use photo',
      saveAvatar: 'Save photo',
      notices: {
        'username-required': 'Choose a username.',
        'username-invalid': 'Usernames use letters, digits, and hyphens, and cannot be an event id.',
        'username-taken': 'That username is already used.',
        'name-required': 'Enter your given name and family name.',
        'email-invalid': 'Enter an email address.',
        'password-short': 'Use at least 8 characters.',
        'password-long': 'That password is too long.',
        'password-uppercase': 'Add an uppercase letter.',
        'password-lowercase': 'Add a lowercase letter.',
        'password-number': 'Add a number.',
        'password-symbol': 'Add a symbol.',
        'password-mismatch': 'The passwords do not match.',
        'password-rejected': 'Choose a different password.',
        'cognito-not-configured': 'Sign-in is not available yet. Cognito is not configured.',
        'email-unconfirmed': 'Enter the code sent to your email.',
        'account-confirmed': 'Email confirmed. Sign in to continue.',
        'code-sent': 'A new code is on its way.',
        'code-limited': 'Wait a moment before asking for another code.',
        'code-invalid': 'That code is not valid.',
        'reset-sent': 'If the account exists, the reset code is on its way.',
        'password-reset': 'Password saved. Sign in with the new one.',
        'provider-not-allowed': 'That sign-in provider is not available.',
        'not-signed-in': 'Sign in before changing the account.',
        'avatar-rejected': 'That photo could not be used. Choose a JPEG, PNG, or WebP up to 5 MB.',
        'avatar-too-large': 'That photo is larger than 5 MB.',
        'avatar-saved': 'Profile photo saved.',
        'profile-save-failed': 'The profile could not be saved. Try again.',
        'profile-invalid': 'Check the profile details and try again.',
        'profile-saved': 'Profile saved.',
        'sign-in-failed': 'Sign-in could not be completed. Try again.',
      },
    },
    admin: {
      title: 'Events',
      deniedTitle: 'Events are closed',
      deniedBody: 'Only an admin can create an event or set its tickets.',
      newEvent: 'New event',
      editEvent: 'Edit event',
      save: 'Save draft',
      publish: 'Publish',
      draft: 'Draft',
      published: 'Published',
      ended: 'Ended',
      comingUp: 'Coming up',
      endedSection: 'Ended',
      statusCount: '{count} {status}',
      ticketType: '{count} ticket type',
      ticketTypes: '{count} ticket types',
      ticketFrom: 'from {price}',
      ticketCapacity: 'capacity {count}',
      titleLabel: 'Title',
      start: 'Starts',
      end: 'Ends',
      timezone: 'Timezone',
      venue: 'Venue',
      city: 'City',
      description: 'Description',
      image: 'Image URL',
      artists: 'Artists',
      offers: 'Tickets',
      offerName: 'Ticket name',
      price: 'Price in euro',
      capacity: 'How many',
      addOffer: 'Add ticket',
      saved: 'Event saved.',
      invalid: 'Check the event and try again.',
      back: 'All events',
      empty: 'No events yet.',
      detailsTab: 'Details',
      ticketsTab: 'Tickets',
      flyer: 'Flyer',
      flyerRatio: 'Portrait 3:4',
      removeImage: 'Remove',
      uploadImage: 'Upload image',
      replaceImage: 'Replace image',
      noImage: 'No flyer yet',
      imagePlaceholder: 'JPG, PNG, or WebP. Cropped to the event card.',
      imageInvalid: 'Use a JPG, PNG, or WebP under 5 MB.',
      imageHelp: 'This is the image on the event card.',
      cropImage: 'Crop flyer',
      cropHelp: 'Drag and zoom until the flyer fills the frame.',
      zoom: 'Zoom',
      cancel: 'Cancel',
      useImage: 'Use image',
      croppingImage: 'Cropping…',
      eventDetails: 'Event',
      detailsHelp: 'Name, description, and when it happens.',
      when: 'When',
      date: 'Date',
      time: 'Time',
      place: 'Place',
      lineup: 'Lineup',
      lineupHelp: 'Search the artist database or add a name.',
      lineupSearch: 'Search artists',
      lineupEmpty: 'No artists on the lineup yet.',
      addName: 'Add name',
      editArtist: 'Edit profile',
      artistProfile: 'Artist profile',
      artistBio: 'Bio',
      soundcloud: 'SoundCloud',
      instagram: 'Instagram',
      website: 'Website',
      saveArtist: 'Save artist',
      artistSaved: 'Artist saved.',
      artistInvalid: 'Check the artist and try again.',
      artistName: 'Name',
      artistPhoto: 'Photo',
      artistPhotoRatio: 'Square',
      artistNoPhoto: 'No photo yet',
      artistPhotoPlaceholder: 'JPG, PNG, or WebP. Cropped square.',
      artistPhotoHelp: 'This photo is on the artist page.',
      artistCrop: 'Crop photo',
      artistCropHelp: 'Drag and zoom until the photo fills the frame.',
      openArtist: 'Artist page',
      noArtists: 'No matching artists.',
      ticketLadder: 'Ticket types',
      ticketHelp: 'Each type sells one lote at a time. The next lote opens when the earlier one sells out or its end date passes.',
      addType: 'Add ticket type',
      typeName: 'Type name',
      addLote: 'Add lote',
      loteName: 'Lote',
      loteEnds: 'End date',
      moveUp: 'Move up',
      moveDown: 'Move down',
      removeLote: 'Remove',
      onSale: 'On sale',
      scheduled: 'Scheduled',
      soldOut: 'Sold out',
      loteEnded: 'Ended',
      preview: 'Preview',
      boldText: 'Bold',
      italicText: 'Italic',
      markdownHelp: 'Bold and italic',
      saving: 'Saving…',
      country: 'Country',
      genres: 'Genres',
    },
  },
  pt: {
    homeAria: 'Início da Tropical Nomads',
    navHome: 'Início',
    navBookings: 'Bookings',
    calendar: 'Calendário',
    eventsAdmin: 'Eventos',
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
      shop: 'Loja',
    },
    areaDescriptions: {
      'upcoming-events': 'Festas publicadas, com a data, o lugar e quem toca.',
      'my-tickets': 'Os seus ingressos e o QR da porta.',
      'check-in': 'A porta e os admins fazem o check-in de uma festa publicada. Quem já entrou não entra de novo.',
      shop: 'Camisetas bordadas. Comprar grava o pedido e envia no WhatsApp. Nada é cobrado aqui.',
    },
    events: {
      subtitle: 'Todas as datas futuras, a partir da próxima.',
      emptyTitle: 'Nenhum evento futuro',
      emptyBody: 'Volte em breve para novas datas anunciadas.',
      nextUp: 'A seguir',
      buyTickets: 'Comprar ingressos',
      buyTicketsAria: 'Comprar ingressos para {title} no site do vendedor',
      buyInApp: 'Comprar ingresso',
      buyInAppAria: 'Comprar um ingresso em euro para {title}.',
      inAppNote: 'O valor é em euro. Nenhum cartão é cobrado ainda. O ingresso vale para entrar.',
      capacityLabel: '{count} disponíveis',
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
      ready: 'Este ingresso vale para entrar.',
      notCharged: 'Nenhum cartão é cobrado ainda.',
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
      admittedName: 'Check-in feito. {name}',
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
      purposes: { tickets: 'Ingressos', shop: 'Loja' },
      notices: {
        'not-signed-in': 'Entre antes de salvar um meio de pagamento.',
        'billing-required': 'Adicione um endereço de cobrança primeiro.',
        'card-rejected': 'Um número de cartão não é guardado.',
        'billing-saved': 'Endereço de cobrança salvo.',
        'method-saved': 'Meio de pagamento salvo. Nada foi cobrado.',
        'cannot-pay': 'Esta conta não pode pagar.',
        'pending-provider': 'O pagamento está pendente. Ele não foi confirmado.',
        'ticket-ready': 'Seu ingresso está pronto.',
        'sold-out': 'Esse ingresso está esgotado.',
      },
    },
    account: {
      signIn: 'Entrar',
      signOut: 'Sair',
      register: 'Criar conta',
      registerTitle: 'Criar conta',
      signInTitle: 'Entrar',
      signInSubtitle: 'Boas-vindas de volta. Seus ingressos, perfil e acesso aos eventos estão esperando.',
      registerSubtitle: 'Entre para a comunidade Tropical Nomads e mantenha tudo da pista em um só lugar.',
      accountTitle: 'Conta',
      intro: 'Mantenha seus dados atualizados para facilitar ingressos, pedidos e acesso aos eventos.',
      joinCommunity: 'Entre para a comunidade',
      accountRecovery: 'Recuperação da conta',
      email: 'E-mail',
      password: 'Senha',
      confirmPassword: 'Confirmar senha',
      passwordRuleLength: 'Pelo menos 8 caracteres',
      passwordRuleUpper: 'Uma letra maiúscula',
      passwordRuleLower: 'Uma letra minúscula',
      passwordRuleNumber: 'Um número',
      passwordRuleSymbol: 'Um símbolo',
      strengthWeak: 'Fraca',
      strengthFair: 'Razoável',
      strengthGood: 'Boa',
      strengthStrong: 'Forte',
      profileTitle: 'Configure seu perfil',
      profileHelp: 'Conte o que deseja compartilhar. Apenas nome e apelido são obrigatórios.',
      profileDetailsTitle: 'Seu perfil',
      profileDetailsHelp: 'Esses dados podem ser reutilizados em ingressos, pedidos e compras futuras.',
      required: 'Obrigatório',
      saveProfile: 'Salvar perfil',
      username: 'Nome de usuário',
      givenName: 'Nome',
      familyName: 'Apelido',
      displayName: 'Nome de exibição',
      phone: 'Telefone com código do país',
      city: 'Cidade',
      region: 'Estado / região',
      postalCode: 'Código postal',
      country: 'País',
      submitRegister: 'Criar conta',
      submitSignIn: 'Entrar',
      confirmAccount: 'Confirmar e continuar',
      finishProfile: 'Finalizar perfil',
      working: 'Aguarde…',
      orContinueWith: 'Ou continue com',
      showPassword: 'Mostrar senha',
      hidePassword: 'Ocultar senha',
      alreadyHaveAccount: 'Já faz parte da comunidade?',
      newToTropical: 'Novo na Tropical Nomads?',
      confirmationTitle: 'Confira seu e-mail',
      confirmSubtitle: 'Enviamos um código para {email}. Você pode sair e abrir esta página de novo.',
      confirmAskTitle: 'Confirme seu e-mail',
      confirmAskSubtitle: 'Use o endereço da conta que você criou. Voltar a esta página mantém você na etapa do código.',
      continueConfirm: 'Continuar',
      resendCode: 'Reenviar código',
      differentEmail: 'Usar outro e-mail',
      haveCode: 'Tem um código de confirmação?',
      enterCode: 'Informe aqui',
      forgotPassword: 'Esqueci a senha',
      forgotTitle: 'Redefinir senha',
      resetHelp: 'Enviamos um código por e-mail. A nova senha fica no Cognito.',
      confirmationCode: 'Código de confirmação',
      newPassword: 'Nova senha',
      sendCode: 'Enviar código',
      submitReset: 'Salvar nova senha',
      confirmHelp: 'Informe o código do e-mail. Depois de aceito, entre com a senha que você escolheu.',
      continueGoogle: 'Continuar com Google',
      continueApple: 'Continuar com Apple',
      noPaymentMethod: 'Nenhum meio de pagamento foi salvo.',
      disabled: 'Esta conta está desativada. Ela não pode comprar nem fazer a leitura.',
      avatarTitle: 'Foto do perfil',
      avatarHelp: 'Arraste e amplie até a foto preencher o quadrado. A foto salva fica abaixo de 5 MB.',
      avatarChoose: 'Escolher foto',
      avatarRatio: 'Quadrada',
      avatarRemove: 'Remover',
      avatarEmpty: 'Ainda sem foto',
      avatarPlaceholder: 'JPG, PNG ou WebP de até 5 MB.',
      avatarReplace: 'Trocar foto',
      avatarInvalid: 'Use JPEG, PNG ou WebP de até 5 MB.',
      avatarCropTitle: 'Recortar foto',
      avatarCropHelp: 'Arraste e amplie até a foto preencher o quadro.',
      avatarCancel: 'Cancelar',
      avatarZoom: 'Zoom',
      avatarCropping: 'Recortando…',
      avatarUse: 'Usar foto',
      saveAvatar: 'Salvar foto',
      notices: {
        'username-required': 'Escolha um nome de usuário.',
        'username-invalid': 'Use letras, números e hífens. O nome não pode ser o id de um evento.',
        'username-taken': 'Esse nome de usuário já está em uso.',
        'name-required': 'Informe o nome e o apelido.',
        'email-invalid': 'Informe um e-mail.',
        'password-short': 'Use pelo menos 8 caracteres.',
        'password-long': 'Essa senha é longa demais.',
        'password-uppercase': 'Adicione uma letra maiúscula.',
        'password-lowercase': 'Adicione uma letra minúscula.',
        'password-number': 'Adicione um número.',
        'password-symbol': 'Adicione um símbolo.',
        'password-mismatch': 'As senhas não coincidem.',
        'password-rejected': 'Escolha outra senha.',
        'cognito-not-configured': 'A entrada ainda não está disponível. O Cognito não está configurado.',
        'email-unconfirmed': 'Informe o código enviado ao seu e-mail.',
        'account-confirmed': 'E-mail confirmado. Entre para continuar.',
        'code-sent': 'Um novo código está a caminho.',
        'code-limited': 'Espere um momento antes de pedir outro código.',
        'code-invalid': 'Esse código não é válido.',
        'reset-sent': 'Se a conta existir, o código de redefinição está a caminho.',
        'password-reset': 'Senha salva. Entre com a nova senha.',
        'provider-not-allowed': 'Esse provedor de entrada não está disponível.',
        'not-signed-in': 'Entre antes de alterar a conta.',
        'avatar-rejected': 'Essa foto não pôde ser usada. Escolha JPEG, PNG ou WebP de até 5 MB.',
        'avatar-too-large': 'Essa foto é maior que 5 MB.',
        'avatar-saved': 'Foto do perfil salva.',
        'profile-save-failed': 'Não foi possível salvar o perfil. Tente de novo.',
        'profile-invalid': 'Confira os dados do perfil e tente novamente.',
        'profile-saved': 'Perfil salvo.',
        'sign-in-failed': 'Não foi possível entrar. Tente de novo.',
      },
    },
    admin: {
      title: 'Eventos',
      deniedTitle: 'Eventos fechados',
      deniedBody: 'Só um admin cria um evento ou define os ingressos.',
      newEvent: 'Novo evento',
      editEvent: 'Editar evento',
      save: 'Salvar rascunho',
      publish: 'Publicar',
      draft: 'Rascunho',
      published: 'Publicado',
      ended: 'Encerrado',
      comingUp: 'A seguir',
      endedSection: 'Encerrados',
      statusCount: '{count} {status}',
      ticketType: '{count} tipo de ingresso',
      ticketTypes: '{count} tipos de ingresso',
      ticketFrom: 'desde {price}',
      ticketCapacity: 'capacidade {count}',
      titleLabel: 'Título',
      start: 'Começa',
      end: 'Termina',
      timezone: 'Fuso horário',
      venue: 'Local',
      city: 'Cidade',
      description: 'Descrição',
      image: 'URL da imagem',
      artists: 'Artistas',
      offers: 'Ingressos',
      offerName: 'Nome do ingresso',
      price: 'Preço em euro',
      capacity: 'Quantidade',
      addOffer: 'Adicionar ingresso',
      saved: 'Evento salvo.',
      invalid: 'Confira o evento e tente de novo.',
      back: 'Todos os eventos',
      empty: 'Nenhum evento ainda.',
      detailsTab: 'Detalhes',
      ticketsTab: 'Ingressos',
      flyer: 'Cartaz',
      flyerRatio: 'Retrato 3:4',
      removeImage: 'Remover',
      uploadImage: 'Enviar imagem',
      replaceImage: 'Trocar imagem',
      noImage: 'Ainda sem cartaz',
      imagePlaceholder: 'JPG, PNG ou WebP. Recortada para o cartão do evento.',
      imageInvalid: 'Use JPG, PNG ou WebP até 5 MB.',
      imageHelp: 'Esta é a imagem no cartão do evento.',
      cropImage: 'Recortar cartaz',
      cropHelp: 'Arraste e amplie até o cartaz preencher o quadro.',
      zoom: 'Zoom',
      cancel: 'Cancelar',
      useImage: 'Usar imagem',
      croppingImage: 'Recortando…',
      eventDetails: 'Evento',
      detailsHelp: 'Nome, descrição e quando acontece.',
      when: 'Quando',
      date: 'Data',
      time: 'Hora',
      place: 'Local',
      lineup: 'Lineup',
      lineupHelp: 'Procure na base de artistas ou adicione um nome.',
      lineupSearch: 'Procurar artistas',
      lineupEmpty: 'Ainda não há artistas no lineup.',
      addName: 'Adicionar nome',
      editArtist: 'Editar perfil',
      artistProfile: 'Perfil do artista',
      artistBio: 'Bio',
      soundcloud: 'SoundCloud',
      instagram: 'Instagram',
      website: 'Site',
      saveArtist: 'Salvar artista',
      artistSaved: 'Artista salvo.',
      artistInvalid: 'Confira o artista e tente de novo.',
      artistName: 'Nome',
      artistPhoto: 'Foto',
      artistPhotoRatio: 'Quadrada',
      artistNoPhoto: 'Ainda sem foto',
      artistPhotoPlaceholder: 'JPG, PNG ou WebP. Recortada em quadrado.',
      artistPhotoHelp: 'Esta foto aparece na página do artista.',
      artistCrop: 'Recortar foto',
      artistCropHelp: 'Arraste e amplie até a foto preencher o quadro.',
      openArtist: 'Página do artista',
      noArtists: 'Nenhum artista encontrado.',
      ticketLadder: 'Tipos de ingresso',
      ticketHelp: 'Cada tipo vende um lote de cada vez. O próximo lote abre quando o anterior esgota ou a data acaba.',
      addType: 'Adicionar tipo',
      typeName: 'Nome do tipo',
      addLote: 'Adicionar lote',
      loteName: 'Lote',
      loteEnds: 'Data final',
      moveUp: 'Subir',
      moveDown: 'Descer',
      removeLote: 'Remover',
      onSale: 'À venda',
      scheduled: 'Agendado',
      soldOut: 'Esgotado',
      loteEnded: 'Encerrado',
      preview: 'Pré-visualização',
      boldText: 'Negrito',
      italicText: 'Itálico',
      markdownHelp: 'Negrito e itálico',
      saving: 'Salvando…',
      country: 'País',
      genres: 'Géneros',
    },
  },
};

export function presentText(language: Locale, key: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`missing translation ${language}.${key}`);
  }
  return value;
}

export function adminText<K extends keyof AdminCopy>(language: Locale, key: K): string {
  return presentText(language, `admin.${key}`, shellCopy[language].admin[key]);
}

export function shellText<K extends keyof Omit<ShellCopy, 'areas' | 'areaDescriptions' | 'events' | 'tickets' | 'checkIn' | 'account' | 'payments' | 'home' | 'admin'>>(
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

export function paymentPurposeLabel(language: Locale, purpose: 'tickets' | 'shop'): string {
  return presentText(language, `payments.purpose.${purpose}`, shellCopy[language].payments.purposes[purpose]);
}

export function switchLanguageLabel(language: Locale, option: string): string {
  return shellText(language, 'switchLanguage').replaceAll('{label}', option);
}
