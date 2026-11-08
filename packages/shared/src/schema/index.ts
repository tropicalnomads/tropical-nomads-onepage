import { partyFields } from './catalog.ts';

export const schemas = {
  party: partyFields,
  artist: ['id', 'name', 'country', 'isoCountry', 'countryFlag', 'genres', 'agencies', 'labels', 'stage'],
  venue: ['id', 'name', 'city', 'country', 'isoCountry', 'address', 'geo', 'mapUrl'],
  partner: ['id', 'name', 'city', 'handle', 'instagram'],
  label: ['id', 'name'],
  agency: ['id', 'name'],
  socialLink: ['id', 'platform', 'label', 'handle', 'url'],
  calendarEntry: ['id', 'artistId', 'partyId'],
  profile: [
    'sub',
    'email',
    'emailVerified',
    'username',
    'givenName',
    'familyName',
    'displayName',
    'avatarKey',
    'phone',
    'providers',
    'createdAt',
    'updatedAt',
    'status',
    'role',
    'locale',
    'billingAddressId',
  ],
  billingAddress: ['id', 'recipientName', 'line1', 'line2', 'city', 'region', 'postalCode', 'country'],
  paymentMethod: [
    'id',
    'userId',
    'type',
    'providerCustomerReference',
    'providerMethodReference',
    'brand',
    'last4',
    'expiryMonth',
    'expiryYear',
    'billingAddressId',
    'status',
  ],
  order: ['id', 'userId', 'purpose', 'lines', 'traceId', 'createdAt'],
  paymentTrace: ['id', 'userId', 'amount', 'currency', 'purpose', 'reference', 'status'],
  issuedTicket: ['id', 'partyId', 'traceId', 'buyerId', 'secret', 'createdAt', 'validForEntry'],
  checkIn: ['id', 'ticketId', 'partyId', 'at', 'actorId', 'result', 'reason'],
  doorInvite: ['id', 'email', 'userId', 'partyIds', 'revoked'],
  product: ['id', 'name', 'image', 'alt', 'amount', 'currency', 'pickup', 'stockNote'],
  stockCount: ['productId', 'size', 'count'],
  stockCorrection: ['id', 'productId', 'size', 'actorId', 'at', 'oldCount', 'newCount'],
  marketingConsent: ['id', 'subjectKind', 'subjectId', 'purpose', 'consentedAt', 'stoppedAt', 'stopToken'],
  emailTemplate: ['id', 'purpose', 'marketing', 'subject', 'body'],
  emailSend: ['id', 'templateId', 'recipient', 'language', 'purpose', 'at'],
  outsideParty: ['id', 'name'],
  artistOffer: ['id', 'outsidePartyId', 'artistId', 'sendId'],
} as const;

export const publishedSchemas = ['party', 'artist', 'venue', 'partner', 'label', 'agency', 'socialLink'] as const;

export { parseAffiliation, parseArtist, parseCalendarEntry, parsePartner, parseParty, parseSocialLink, parseVenueRecord } from './catalog.ts';
export { parseBillingAddress, parsePaymentMethod, parseProfile } from './account.ts';
export {
  parseCheckIn,
  parseDoorInvite,
  parseIssuedTicket,
  parseOrder,
  parsePaymentTrace,
  parseProduct,
  parseQrPayload,
  parseStockCorrection,
  parseStockCount,
  ticketSecretMatches,
} from './commerce.ts';
export { parseArtistOffer, parseEmailSend, parseEmailTemplate, parseMarketingConsent, parseOutsideParty } from './mail.ts';
export { declareLookup, lookups } from './lookups.ts';
export { parseConsents, parseProfiles, parseStockCounts } from './unique.ts';
