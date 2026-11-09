import { locales, type Locale } from '../constants/locales.ts';
import { fail, ok, type ParseResult } from './result.ts';

export { locales };
export type { Locale };

export const roles = ['admin', 'door', 'user'] as const;
export type Role = (typeof roles)[number];

export const paymentPurposes = ['tickets', 'shop'] as const;
export type PaymentPurpose = (typeof paymentPurposes)[number];

export const traceStatuses = ['pending_provider', 'confirmed'] as const;
export type TraceStatus = (typeof traceStatuses)[number];

export const signInProviders = ['cognito', 'google', 'apple'] as const;
export type SignInProvider = (typeof signInProviders)[number];

export const accountStatuses = ['active', 'disabled'] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const paymentMethodTypes = ['card', 'apple_pay', 'google_pay', 'other'] as const;
export type PaymentMethodType = (typeof paymentMethodTypes)[number];

export const stockSizes = ['P', 'M', 'G', 'GG', '2XL'] as const;
export type StockSize = (typeof stockSizes)[number];

export const checkInResults = ['accepted', 'refused'] as const;
export type CheckInResult = (typeof checkInResults)[number];

export const checkInReasons = ['unknown', 'unpaid', 'wrong party', 'already used'] as const;
export type CheckInReason = (typeof checkInReasons)[number];

export const consentSubjects = ['account', 'outsideParty'] as const;
export type ConsentSubject = (typeof consentSubjects)[number];

export const partyTypes = ['Club', 'Open Air', 'Festival', 'Indoor', 'In- & Outdoor', 'Virtual'] as const;
export type PartyType = (typeof partyTypes)[number];

export const templateIds = [
  'registration',
  'ticket-purchase',
  'shop-purchase',
  'door-invite',
  'new-party',
  'artist-offer',
] as const;
export type TemplateId = (typeof templateIds)[number];

export function marketingFor(id: TemplateId): boolean {
  switch (id) {
    case 'registration':
    case 'ticket-purchase':
    case 'shop-purchase':
    case 'door-invite':
      return false;
    case 'new-party':
    case 'artist-offer':
      return true;
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

export function parseEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): ParseResult<T> {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return ok(value as T);
  }
  return fail(`${field} is not allowed`);
}

export interface SchemaRefs {
  partyIds?: readonly string[];
  artistIds?: readonly string[];
  productIds?: readonly string[];
  profileIds?: readonly string[];
  traceIds?: readonly string[];
  ticketIds?: readonly string[];
  guestIds?: readonly string[];
  outsidePartyIds?: readonly string[];
  billingAddressIds?: readonly string[];
  templateIds?: readonly string[];
  publicPartyIds?: readonly string[];
}

export function requireRef(
  ids: readonly string[] | undefined,
  id: string,
  field: string,
  errors: string[],
): void {
  if (ids !== undefined && !ids.includes(id)) {
    errors.push(`${field} does not exist`);
  }
}
