import { fail, ok, type ParseResult } from './result.ts';

export interface Lookup {
  record: string;
  fields: readonly string[];
  unique: boolean;
}

const forbiddenLookupFields = ['secret', 'cardNumber', 'cvc', 'cvv', 'pan', '*'] as const;
const forbiddenRecords = ['customer', 'customers', 'everyCustomer'] as const;

export function declareLookup(spec: Lookup): ParseResult<Lookup> {
  if ((forbiddenRecords as readonly string[]).includes(spec.record)) {
    return fail('that lookup is not allowed');
  }
  if (spec.fields.length === 0) {
    return fail('a lookup needs a field');
  }
  for (const field of spec.fields) {
    if ((forbiddenLookupFields as readonly string[]).includes(field)) {
      return fail(`${field} is not a lookup`);
    }
  }
  return ok(spec);
}

function lookup(record: string, fields: readonly string[], unique: boolean): Lookup {
  const declared = declareLookup({ record, fields, unique });
  if (!declared.ok) {
    throw new Error(declared.errors.join('; '));
  }
  return declared.value;
}

export const lookups = {
  partyById: lookup('party', ['id'], true),
  partiesByDateStart: lookup('party', ['dateStart'], false),
  artistById: lookup('artist', ['id'], true),
  venueById: lookup('venue', ['id'], true),
  partnerById: lookup('partner', ['id'], true),
  labelById: lookup('label', ['id'], true),
  agencyById: lookup('agency', ['id'], true),
  socialLinkById: lookup('socialLink', ['id'], true),
  calendarByArtist: lookup('calendarEntry', ['artistId'], false),
  calendarByParty: lookup('calendarEntry', ['partyId'], false),
  calendarEntryById: lookup('calendarEntry', ['id'], true),
  calendarByArtistAndParty: lookup('calendarEntry', ['artistId', 'partyId'], true),
  profileBySub: lookup('profile', ['sub'], true),
  profileByEmail: lookup('profile', ['email'], true),
  profileByUsername: lookup('profile', ['username'], true),
  profileByProviderSubject: lookup('profile', ['provider', 'providerSubject'], true),
  paymentMethodsByUser: lookup('paymentMethod', ['userId'], false),
  paymentMethodById: lookup('paymentMethod', ['id'], true),
  traceById: lookup('paymentTrace', ['id'], true),
  tracesByUser: lookup('paymentTrace', ['userId'], false),
  issuedTicketById: lookup('issuedTicket', ['id'], true),
  ticketsByBuyer: lookup('issuedTicket', ['buyerId'], false),
  ordersByUser: lookup('order', ['userId'], false),
  orderById: lookup('order', ['id'], true),
  inviteByUser: lookup('doorInvite', ['userId'], false),
  inviteByEmail: lookup('doorInvite', ['email'], false),
  inviteById: lookup('doorInvite', ['id'], true),
  checkInsByTicket: lookup('checkIn', ['ticketId'], false),
  checkInById: lookup('checkIn', ['id'], true),
  productById: lookup('product', ['id'], true),
  stockByProductAndSize: lookup('stockCount', ['productId', 'size'], true),
  correctionsByProduct: lookup('stockCorrection', ['productId'], false),
  templateById: lookup('emailTemplate', ['id'], true),
  consentBySubject: lookup('marketingConsent', ['subjectKind', 'subjectId'], true),
  consentByStopToken: lookup('marketingConsent', ['stopToken'], true),
  outsidePartyById: lookup('outsideParty', ['id'], true),
  artistOfferById: lookup('artistOffer', ['id'], true),
} as const;
