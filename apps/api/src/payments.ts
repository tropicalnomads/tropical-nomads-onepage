import { randomBytes } from 'node:crypto';
import {
  accountCanPurchase,
  containsCardNumber,
  decideAccess,
  parsePaymentMethod,
  parsePaymentTrace,
  type PaymentMethod,
  type PaymentPurpose,
  type PaymentTrace,
  type Role,
} from 'tropical-nomads-shared';
import { loadAccounts, readAccounts, updateAccounts, type AccountFile } from './accounts.ts';
import { usingDatabase } from './database.ts';
import { operationalDirectory, readOperational, updateOperational } from './operational.ts';
import { queueDatabase, readStoredCollection, writeStoredCollection } from './sql-store.ts';

export interface PaymentCaller {
  role: Role;
  actorId: string;
}

export interface PaymentCustomer {
  userId: string;
  providerCustomerReference: string;
}

export interface PaymentDraft {
  userId: string;
  amount: number;
  currency: string;
  reference: string;
  status?: string;
}

export interface StartedPayment {
  traces: PaymentTrace[];
  trace: PaymentTrace;
}

export interface RefundResult {
  applied: false;
}

const privateKeys = new Set(['secret', 'password', 'cardNumber', 'cvc', 'cvv', 'pan', '__proto__', 'constructor', 'prototype']);
const methodFields = ['type', 'brand', 'last4', 'expiryMonth', 'expiryYear'] as const;
const methodTypes = ['card', 'apple_pay', 'google_pay', 'other'] as const;
const methodLimit = 8;
const traceLimit = 20;

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(9).toString('hex')}`;
}

function assertClean(value: unknown): void {
  if (containsPrivateKey(value) || containsCardNumber(value)) {
    throw new Error('card number is not allowed');
  }
}

function containsPrivateKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsPrivateKey(item));
  }
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.entries(value).some(([key, inner]) => privateKeys.has(key) || containsPrivateKey(inner));
}

function assertSelf(caller: PaymentCaller, userId: string): void {
  const decision = decideAccess({ action: 'use-payment', role: caller.role, actorId: caller.actorId, subjectId: userId });
  if (decision.effect !== 'allow' || decision.actorId !== userId) {
    throw new Error('payment is not allowed');
  }
}

function activeProfile(file: AccountFile, userId: string) {
  const profile = file.profiles.find((item) => item.sub === userId);
  if (!profile || !accountCanPurchase(profile)) {
    throw new Error('payment is not allowed');
  }
  return profile;
}

function requireBilling(file: AccountFile, billingAddressId: string | undefined): string {
  if (!billingAddressId || !file.billingAddresses.some((address) => address.id === billingAddressId)) {
    throw new Error('billing address is required');
  }
  return billingAddressId;
}

function money(amount: number): boolean {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return false;
  }
  return /^\d+(\.\d{1,2})?$/.test(amount.toString());
}

function integerField(value: unknown, min: number, max: number): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^\d{1,4}$/.test(value) ? Number(value) : undefined;
  if (parsed === undefined || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    return undefined;
  }
  return parsed;
}

function parseStoredTrace(input: unknown): PaymentTrace {
  const parsed = parsePaymentTrace(input);
  if (!parsed.ok) {
    throw new Error('payment trace is not stored');
  }
  return parsed.value;
}

export function readTraces(root = operationalDirectory()): PaymentTrace[] {
  return readOperational('payment-traces', root).records.map((record) => parseStoredTrace(record));
}

export async function loadTraces(root?: string): Promise<PaymentTrace[]> {
  if (usingDatabase(root)) {
    return (await readStoredCollection('payment-traces')).records.map((record) => parseStoredTrace(record));
  }
  return readTraces(root ?? operationalDirectory());
}

export function createCustomer(file: AccountFile, caller: PaymentCaller, userId: string): PaymentCustomer {
  assertSelf(caller, userId);
  if (!file.profiles.some((profile) => profile.sub === userId)) {
    throw new Error('payment is not allowed');
  }
  return { userId, providerCustomerReference: `local:${userId}` };
}

export function attachPaymentMethod(file: AccountFile, caller: PaymentCaller, userId: string, method: unknown): AccountFile {
  assertClean(method);
  assertSelf(caller, userId);
  const profile = activeProfile(file, userId);
  const billingAddressId = requireBilling(file, profile.billingAddressId);
  if (file.paymentMethods.filter((item) => item.userId === userId).length >= methodLimit) {
    throw new Error('payment is not allowed');
  }
  if (typeof method !== 'object' || method === null || Array.isArray(method)) {
    throw new Error('payment method is not a method');
  }
  const record = method as Record<string, unknown>;
  if (Object.keys(record).some((key) => !(methodFields as readonly string[]).includes(key))) {
    throw new Error('payment method is not a method');
  }
  const type = methodTypes.find((item) => item === record.type);
  const brand = typeof record.brand === 'string' ? record.brand.trim() : '';
  const last4 = typeof record.last4 === 'string' ? record.last4.trim() : '';
  const expiryMonth = integerField(record.expiryMonth, 1, 12);
  const expiryYear = integerField(record.expiryYear, 2000, 2100);
  if (!type || !/^[A-Za-z][A-Za-z &.-]{0,39}$/.test(brand) || !/^\d{4}$/.test(last4) || expiryMonth === undefined || expiryYear === undefined) {
    throw new Error('payment method is not a method');
  }
  const customer = createCustomer(file, caller, userId);
  const id = newId('method');
  const parsed = parsePaymentMethod(
    {
      id,
      userId,
      type,
      providerCustomerReference: customer.providerCustomerReference,
      providerMethodReference: `local-method:${id}`,
      brand,
      last4,
      expiryMonth,
      expiryYear,
      billingAddressId,
      status: 'stored',
    },
    {
      profileIds: file.profiles.map((item) => item.sub),
      billingAddressIds: file.billingAddresses.map((address) => address.id),
    },
  );
  if (!parsed.ok) {
    throw new Error('payment method is not a method');
  }
  return { ...file, paymentMethods: [...file.paymentMethods, parsed.value] };
}

export function listPaymentMethods(file: AccountFile, caller: PaymentCaller, userId: string): PaymentMethod[] {
  assertSelf(caller, userId);
  return file.paymentMethods.filter((method) => method.userId === userId).map((method) => ({ ...method }));
}

export function startPayment(file: AccountFile, traces: readonly PaymentTrace[], input: PaymentDraft & { purpose: string }, caller: PaymentCaller): StartedPayment {
  assertClean(input);
  assertSelf(caller, input.userId);
  const profile = activeProfile(file, input.userId);
  requireBilling(file, profile.billingAddressId);
  if (traces.filter((trace) => trace.userId === input.userId).length >= traceLimit) {
    throw new Error('payment is not allowed');
  }
  const purpose: PaymentPurpose | undefined = input.purpose === 'tickets' || input.purpose === 'shop' ? input.purpose : undefined;
  const currency = input.currency.trim().toUpperCase();
  const reference = input.reference.trim();
  if (!purpose) {
    throw new Error('purpose is not allowed');
  }
  if (!money(input.amount)) {
    throw new Error('amount is not valid');
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('currency is not valid');
  }
  if (!/^[A-Za-z0-9:_./-]{1,120}$/.test(reference)) {
    throw new Error('reference is not valid');
  }
  // A requested status is not copied onto the trace.
  void input.status;
  const parsed = parsePaymentTrace({
    id: newId('trace'),
    userId: input.userId,
    amount: input.amount,
    currency,
    purpose,
    reference,
    status: 'pending_provider',
  });
  if (!parsed.ok) {
    throw new Error('payment trace is not pending');
  }
  return { traces: [...traces, parsed.value], trace: parsed.value };
}

export function startTicketPayment(file: AccountFile, traces: readonly PaymentTrace[], input: PaymentDraft, caller: PaymentCaller): StartedPayment {
  return startPayment(file, traces, { ...input, purpose: 'tickets' }, caller);
}

export function startShopPayment(file: AccountFile, traces: readonly PaymentTrace[], input: PaymentDraft, caller: PaymentCaller): StartedPayment {
  return startPayment(file, traces, { ...input, purpose: 'shop' }, caller);
}

export function listTraces(caller: PaymentCaller, traces: readonly PaymentTrace[], subjectId: string): PaymentTrace[] {
  const decision = decideAccess({ action: 'read-traces', role: caller.role, actorId: caller.actorId, subjectId });
  if (decision.effect !== 'allow') {
    throw new Error('payment is not allowed');
  }
  return [...visibleTraces(caller, traces, subjectId)];
}

export interface AdminTraceRow {
  id: string;
  username: string;
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  status: PaymentTrace['status'];
}

/** Stored traces for an admin. The username is the profile name, never the subject. */
export function adminTraceRows(
  caller: PaymentCaller,
  traces: readonly PaymentTrace[],
  profiles: readonly { sub: string; username: string }[],
): AdminTraceRow[] {
  if (caller.role !== 'admin') {
    throw new Error('payment is not allowed');
  }
  const names = new Map(profiles.map((profile) => [profile.sub, profile.username]));
  return listTraces(caller, traces, '').map((trace) => ({
    id: trace.id,
    username: names.get(trace.userId) ?? '',
    amount: trace.amount,
    currency: trace.currency,
    purpose: trace.purpose,
    status: trace.status,
  }));
}

function visibleTraces(caller: PaymentCaller, traces: readonly PaymentTrace[], subjectId: string): readonly PaymentTrace[] {
  switch (caller.role) {
    case 'admin':
      return subjectId === '' ? traces : traces.filter((trace) => trace.userId === subjectId);
    case 'user':
      return traces.filter((trace) => trace.userId === caller.actorId);
    case 'door':
      throw new Error('payment is not allowed');
    default: {
      const unexpected: never = caller.role;
      throw new Error(unexpected);
    }
  }
}

/**
 * The provider adapter is not connected. This does not write, and the status stays `pending_provider`.
 * The apps do not call it.
 */
export function markPaymentConfirmed(traces: readonly PaymentTrace[], traceId: string, providerReference: string): PaymentTrace[] {
  assertClean(providerReference);
  if (traceId.trim() === '' || providerReference.trim() === '' || !traces.some((trace) => trace.id === traceId)) {
    throw new Error('provider adapter is not connected');
  }
  return traces.map((trace) => ({ ...trace, status: 'pending_provider' }));
}

/** Refund rules stay open. This does not write and does not change a trace. */
export function recordRefund(traceId: string): RefundResult {
  if (traceId.trim() === '') {
    throw new Error('refund rules are still open');
  }
  return { applied: false };
}

export function commitPayment(purpose: PaymentPurpose, input: PaymentDraft, caller: PaymentCaller, root?: string): Promise<PaymentTrace> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const started = begin(purpose, await loadAccounts(), await loadTraces(), input, caller);
      await writeStoredCollection('payment-traces', { schemaVersion: 1, records: started.traces });
      const trace = (await loadTraces()).find((item) => item.id === started.trace.id);
      if (!trace) {
        throw new Error('payment was not stored');
      }
      return trace;
    });
  }
  const directory = root ?? operationalDirectory();
  let createdId = '';
  return updateOperational(
    'payment-traces',
    (current) => {
      const existing = current.records.map((record) => parseStoredTrace(record));
      const started = begin(purpose, readAccounts(directory), existing, input, caller);
      createdId = started.trace.id;
      return { schemaVersion: 1, records: started.traces };
    },
    directory,
  ).then((file) => {
    const trace = file.records.map((record) => parseStoredTrace(record)).find((item) => item.id === createdId);
    if (!trace) {
      throw new Error('payment was not stored');
    }
    return trace;
  });
}

export function commitPaymentMethod(caller: PaymentCaller, userId: string, method: unknown, root?: string): Promise<AccountFile> {
  return updateAccounts((current) => attachPaymentMethod(current, caller, userId, method), root);
}

function begin(purpose: PaymentPurpose, file: AccountFile, traces: readonly PaymentTrace[], input: PaymentDraft, caller: PaymentCaller): StartedPayment {
  switch (purpose) {
    case 'tickets':
      return startTicketPayment(file, traces, input, caller);
    case 'shop':
      return startShopPayment(file, traces, input, caller);
    default: {
      const unexpected: never = purpose;
      throw new Error(unexpected);
    }
  }
}
