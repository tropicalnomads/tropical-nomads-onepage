import {
  containsCardNumber,
  fail,
  finish,
  optionalString,
  readRecord,
  rejectSensitive,
  rejectUnknown,
  requireBoolean,
  requireInteger,
  requireString,
  type ParseResult,
} from './result.ts';
import {
  accountStatuses,
  locales,
  parseEnum,
  paymentMethodTypes,
  requireRef,
  roles,
  signInProviders,
  type AccountStatus,
  type Locale,
  type PaymentMethodType,
  type Role,
  type SchemaRefs,
  type SignInProvider,
} from './values.ts';

export interface ProviderLink {
  provider: SignInProvider;
  subject: string;
}

export interface Profile {
  sub: string;
  email: string;
  emailVerified: boolean;
  username: string;
  givenName: string;
  familyName: string;
  displayName?: string;
  avatarKey?: string;
  phone?: string;
  providers: readonly ProviderLink[];
  createdAt: string;
  updatedAt: string;
  status: AccountStatus;
  role: Role;
  locale?: Locale;
  billingAddressId?: string;
}

export interface BillingAddress {
  id: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  providerCustomerReference: string;
  providerMethodReference: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  billingAddressId: string;
  status: string;
}

const profileFields = [
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
] as const;

const phonePattern = /^\+[1-9]\d{1,14}$/;

export function parseProfile(input: unknown, refs: SchemaRefs = {}): ParseResult<Profile> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, profileFields, errors);
  rejectSensitive(read.value, errors);
  const sub = requireString(read.value, 'sub', errors);
  const email = requireString(read.value, 'email', errors);
  if (email && !email.includes('@')) {
    errors.push('email is not an email');
  }
  const emailVerified = requireBoolean(read.value, 'emailVerified', errors);
  const username = requireString(read.value, 'username', errors);
  const givenName = requireString(read.value, 'givenName', errors);
  const familyName = requireString(read.value, 'familyName', errors);
  const displayName = optionalString(read.value, 'displayName', errors);
  const avatarKey = optionalString(read.value, 'avatarKey', errors);
  const phone = optionalString(read.value, 'phone', errors);
  if (phone && !phonePattern.test(phone)) {
    errors.push('phone is not E.164');
  }
  const createdAt = requireString(read.value, 'createdAt', errors);
  const updatedAt = requireString(read.value, 'updatedAt', errors);
  const statusResult = parseEnum(read.value.status, accountStatuses, 'status');
  if (!statusResult.ok) errors.push(...statusResult.errors);
  const roleResult = parseEnum(read.value.role, roles, 'role');
  if (!roleResult.ok) errors.push(...roleResult.errors);
  let locale: Locale | undefined;
  if ('locale' in read.value && read.value.locale !== undefined) {
    const parsed = parseEnum(read.value.locale, locales, 'locale');
    if (!parsed.ok) errors.push(...parsed.errors);
    else locale = parsed.value;
  }
  const billingAddressId = optionalString(read.value, 'billingAddressId', errors);
  if (billingAddressId) requireRef(refs.billingAddressIds, billingAddressId, 'billingAddressId', errors);
  const providers: ProviderLink[] = [];
  if (!Array.isArray(read.value.providers) || read.value.providers.length === 0) {
    errors.push('providers is required');
  } else {
    for (const providerInput of read.value.providers) {
      const readProvider = readRecord(providerInput);
      if (!readProvider.ok) {
        errors.push(...readProvider.errors);
        continue;
      }
      rejectUnknown(readProvider.value, ['provider', 'subject'], errors);
      const provider = parseEnum(readProvider.value.provider, signInProviders, 'provider');
      const subject = requireString(readProvider.value, 'subject', errors);
      if (!provider.ok) errors.push(...provider.errors);
      if (provider.ok && subject) providers.push({ provider: provider.value, subject });
    }
  }
  if (!sub || !email || emailVerified === undefined || !username || !givenName || !familyName || !createdAt || !updatedAt || !statusResult.ok || !roleResult.ok) {
    return fail(errors);
  }
  const profile: Profile = {
    sub,
    email,
    emailVerified,
    username,
    givenName,
    familyName,
    providers,
    createdAt,
    updatedAt,
    status: statusResult.value,
    role: roleResult.value,
  };
  if (displayName) profile.displayName = displayName;
  if (avatarKey) profile.avatarKey = avatarKey;
  if (phone) profile.phone = phone;
  if (locale) profile.locale = locale;
  if (billingAddressId) profile.billingAddressId = billingAddressId;
  return finish(errors, profile);
}

export function parseBillingAddress(input: unknown): ParseResult<BillingAddress> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'recipientName', 'line1', 'line2', 'city', 'region', 'postalCode', 'country'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const recipientName = requireString(read.value, 'recipientName', errors);
  const line1 = requireString(read.value, 'line1', errors);
  const line2 = optionalString(read.value, 'line2', errors);
  const city = requireString(read.value, 'city', errors);
  const region = requireString(read.value, 'region', errors);
  const postalCode = requireString(read.value, 'postalCode', errors);
  const country = requireString(read.value, 'country', errors);
  if (!id || !recipientName || !line1 || !city || !region || !postalCode || !country) {
    return fail(errors);
  }
  const address: BillingAddress = { id, recipientName, line1, city, region, postalCode, country };
  if (line2) address.line2 = line2;
  return finish(errors, address);
}

const paymentFields = [
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
] as const;

export function parsePaymentMethod(input: unknown, refs: SchemaRefs = {}): ParseResult<PaymentMethod> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, paymentFields, errors);
  rejectSensitive(read.value, errors);
  if (containsCardNumber(input)) {
    errors.push('card number is not allowed');
  }
  const id = requireString(read.value, 'id', errors);
  const userId = requireString(read.value, 'userId', errors);
  if (userId) requireRef(refs.profileIds, userId, 'userId', errors);
  const type = parseEnum(read.value.type, paymentMethodTypes, 'type');
  if (!type.ok) errors.push(...type.errors);
  const providerCustomerReference = requireString(read.value, 'providerCustomerReference', errors);
  const providerMethodReference = requireString(read.value, 'providerMethodReference', errors);
  const brand = requireString(read.value, 'brand', errors);
  const last4 = requireString(read.value, 'last4', errors);
  if (last4 && !/^\d{4}$/.test(last4)) {
    errors.push('last4 must be 4 digits');
  }
  const expiryMonth = requireInteger(read.value, 'expiryMonth', errors, 1);
  if (expiryMonth !== undefined && expiryMonth > 12) {
    errors.push('expiryMonth is out of range');
  }
  const expiryYear = requireInteger(read.value, 'expiryYear', errors, 2000);
  const billingAddressId = requireString(read.value, 'billingAddressId', errors);
  if (billingAddressId) requireRef(refs.billingAddressIds, billingAddressId, 'billingAddressId', errors);
  const status = requireString(read.value, 'status', errors);
  if (!id || !userId || !type.ok || !providerCustomerReference || !providerMethodReference || !brand || !last4 || expiryMonth === undefined || expiryYear === undefined || !billingAddressId || !status) {
    return fail(errors);
  }
  return finish(errors, {
    id,
    userId,
    type: type.value,
    providerCustomerReference,
    providerMethodReference,
    brand,
    last4,
    expiryMonth,
    expiryYear,
    billingAddressId,
    status,
  });
}
