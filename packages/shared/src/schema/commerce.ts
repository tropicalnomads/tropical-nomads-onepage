import {
  fail,
  finish,
  isRecord,
  optionalString,
  readRecord,
  rejectSensitive,
  rejectUnknown,
  requireBoolean,
  requireFinite,
  requireInteger,
  requireString,
  type ParseResult,
} from './result.ts';
import {
  checkInReasons,
  checkInResults,
  parseEnum,
  paymentPurposes,
  requireRef,
  stockSizes,
  traceStatuses,
  type CheckInReason,
  type CheckInResult,
  type PaymentPurpose,
  type SchemaRefs,
  type StockSize,
  type TraceStatus,
} from './values.ts';

export interface TicketLine {
  kind: 'ticket';
  partyId: string;
  offerName: string;
  quantity: number;
}

export interface MerchLine {
  kind: 'merch';
  productId: string;
  size: StockSize;
  quantity: number;
}

export type OrderLine = TicketLine | MerchLine;

export interface Order {
  id: string;
  userId: string;
  purpose: PaymentPurpose;
  lines: readonly OrderLine[];
  traceId: string;
  createdAt: string;
}

export interface PaymentTrace {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  reference: string;
  status: TraceStatus;
}

export interface IssuedTicket {
  id: string;
  partyId: string;
  traceId: string;
  buyerId: string;
  secret: string;
  createdAt: string;
  validForEntry: false;
}

export interface QrPayload {
  id: string;
  secret: string;
}

export interface CheckIn {
  id: string;
  ticketId: string;
  partyId: string;
  at: string;
  actorId: string;
  result: CheckInResult;
  reason?: CheckInReason;
}

export interface DoorInvite {
  id: string;
  email: string;
  userId?: string;
  partyIds: readonly string[];
  revoked: boolean;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  alt: string;
  amount: number;
  currency?: string;
  pickup: string;
  stockNote: string;
}

export interface StockCount {
  productId: string;
  size: StockSize;
  count: number;
}

export interface StockCorrection {
  id: string;
  productId: string;
  size: StockSize;
  actorId: string;
  at: string;
  oldCount: number;
  newCount: number;
}

function parseLine(input: unknown, refs: SchemaRefs, errors: string[]): OrderLine | undefined {
  if (!isRecord(input)) {
    errors.push('line must be an object');
    return undefined;
  }
  rejectUnknown(input, ['kind', 'partyId', 'offerName', 'productId', 'size', 'quantity'], errors);
  rejectSensitive(input, errors);
  const kind = input.kind;
  const quantity = requireInteger(input, 'quantity', errors, 1);
  if (kind === 'ticket') {
    const partyId = requireString(input, 'partyId', errors);
    const offerName = requireString(input, 'offerName', errors);
    if (partyId) requireRef(refs.partyIds, partyId, 'partyId', errors);
    if (!partyId || !offerName || quantity === undefined) return undefined;
    return { kind: 'ticket', partyId, offerName, quantity };
  }
  if (kind === 'merch') {
    const productId = requireString(input, 'productId', errors);
    const size = parseEnum(input.size, stockSizes, 'size');
    if (!size.ok) errors.push(...size.errors);
    if (productId) requireRef(refs.productIds, productId, 'productId', errors);
    if (!productId || !size.ok || quantity === undefined) return undefined;
    return { kind: 'merch', productId, size: size.value, quantity };
  }
  errors.push('line kind is not allowed');
  return undefined;
}

export function parseOrder(input: unknown, refs: SchemaRefs = {}): ParseResult<Order> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'userId', 'purpose', 'lines', 'traceId', 'createdAt'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const userId = requireString(read.value, 'userId', errors);
  if (userId) requireRef(refs.profileIds, userId, 'userId', errors);
  const purpose = parseEnum(read.value.purpose, paymentPurposes, 'purpose');
  if (!purpose.ok) errors.push(...purpose.errors);
  const traceId = requireString(read.value, 'traceId', errors);
  if (traceId) requireRef(refs.traceIds, traceId, 'traceId', errors);
  const createdAt = requireString(read.value, 'createdAt', errors);
  const lines: OrderLine[] = [];
  if (!Array.isArray(read.value.lines)) {
    errors.push('lines is required');
  } else {
    for (const line of read.value.lines) {
      const parsed = parseLine(line, refs, errors);
      if (parsed) lines.push(parsed);
    }
  }
  if (!id || !userId || !purpose.ok || !traceId || !createdAt) return fail(errors);
  return finish(errors, { id, userId, purpose: purpose.value, lines, traceId, createdAt });
}

export function parsePaymentTrace(input: unknown, refs: SchemaRefs = {}): ParseResult<PaymentTrace> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'userId', 'amount', 'currency', 'purpose', 'reference', 'status'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const userId = requireString(read.value, 'userId', errors);
  if (userId) requireRef(refs.profileIds, userId, 'userId', errors);
  const amount = requireFinite(read.value, 'amount', errors);
  const currency = requireString(read.value, 'currency', errors);
  const purpose = parseEnum(read.value.purpose, paymentPurposes, 'purpose');
  if (!purpose.ok) errors.push(...purpose.errors);
  const reference = requireString(read.value, 'reference', errors);
  const status = parseEnum(read.value.status, traceStatuses, 'status');
  if (!status.ok) errors.push(...status.errors);
  if (!id || !userId || amount === undefined || !currency || !purpose.ok || !reference || !status.ok) return fail(errors);
  return finish(errors, { id, userId, amount, currency, purpose: purpose.value, reference, status: status.value });
}

export function parseIssuedTicket(input: unknown, refs: SchemaRefs = {}): ParseResult<IssuedTicket> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'partyId', 'traceId', 'buyerId', 'secret', 'createdAt', 'validForEntry'], errors);
  rejectSensitive(read.value, errors, ['secret']);
  const id = requireString(read.value, 'id', errors);
  const partyId = requireString(read.value, 'partyId', errors);
  const traceId = requireString(read.value, 'traceId', errors);
  const buyerId = requireString(read.value, 'buyerId', errors);
  const secret = requireString(read.value, 'secret', errors);
  const createdAt = requireString(read.value, 'createdAt', errors);
  if (partyId) requireRef(refs.partyIds, partyId, 'partyId', errors);
  if (traceId) requireRef(refs.traceIds, traceId, 'traceId', errors);
  if (buyerId) requireRef(refs.profileIds, buyerId, 'buyerId', errors);
  if (secret && partyId && secret === partyId) errors.push('secret must not be the public party id');
  if (read.value.validForEntry !== false) errors.push('validForEntry must be false');
  if (!id || !partyId || !traceId || !buyerId || !secret || !createdAt) return fail(errors);
  return finish(errors, { id, partyId, traceId, buyerId, secret, createdAt, validForEntry: false });
}

export function parseQrPayload(input: unknown): ParseResult<QrPayload> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  if ('partyId' in read.value && !('secret' in read.value)) {
    errors.push('a public party id is not a ticket');
  }
  rejectUnknown(read.value, ['id', 'secret'], errors);
  const id = requireString(read.value, 'id', errors);
  const secret = requireString(read.value, 'secret', errors);
  if (id && secret && secret === id) errors.push('secret must not be the public party id');
  if (!id || !secret) return fail(errors);
  return finish(errors, { id, secret });
}

export function ticketSecretMatches(stored: string, presented: string): boolean {
  const length = Math.max(stored.length, presented.length);
  let mismatch = stored.length === presented.length ? 0 : 1;
  for (let index = 0; index < length; index += 1) {
    const left = stored.charCodeAt(index) || 0;
    const right = presented.charCodeAt(index) || 0;
    mismatch |= left ^ right;
  }
  return mismatch === 0;
}

export function parseCheckIn(input: unknown, refs: SchemaRefs = {}): ParseResult<CheckIn> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'ticketId', 'partyId', 'at', 'actorId', 'result', 'reason'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const ticketId = requireString(read.value, 'ticketId', errors);
  const partyId = requireString(read.value, 'partyId', errors);
  const at = requireString(read.value, 'at', errors);
  const actorId = requireString(read.value, 'actorId', errors);
  if (ticketId) requireRef(refs.ticketIds, ticketId, 'ticketId', errors);
  if (partyId) requireRef(refs.partyIds, partyId, 'partyId', errors);
  if (actorId) requireRef(refs.profileIds, actorId, 'actorId', errors);
  const result = parseEnum(read.value.result, checkInResults, 'result');
  if (!result.ok) errors.push(...result.errors);
  let reason: CheckInReason | undefined;
  if ('reason' in read.value && read.value.reason !== undefined) {
    const parsed = parseEnum(read.value.reason, checkInReasons, 'reason');
    if (!parsed.ok) errors.push(...parsed.errors);
    else reason = parsed.value;
  }
  if (result.ok && result.value === 'accepted' && reason) errors.push('reason is only for a refused scan');
  if (result.ok && result.value === 'refused' && !reason) errors.push('reason is required');
  if (!id || !ticketId || !partyId || !at || !actorId || !result.ok) return fail(errors);
  const checkIn: CheckIn = { id, ticketId, partyId, at, actorId, result: result.value };
  if (reason) checkIn.reason = reason;
  return finish(errors, checkIn);
}

export function parseDoorInvite(input: unknown, refs: SchemaRefs = {}): ParseResult<DoorInvite> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'email', 'userId', 'partyIds', 'revoked'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const email = requireString(read.value, 'email', errors);
  const userId = optionalString(read.value, 'userId', errors);
  if (userId) requireRef(refs.profileIds, userId, 'userId', errors);
  const revoked = requireBoolean(read.value, 'revoked', errors);
  const partyIds: string[] = [];
  if (!Array.isArray(read.value.partyIds) || read.value.partyIds.length === 0) {
    errors.push('partyIds is required');
  } else {
    for (const partyId of read.value.partyIds) {
      if (typeof partyId !== 'string' || partyId.trim() === '') {
        errors.push('partyIds must be ids');
        continue;
      }
      requireRef(refs.partyIds, partyId, 'partyIds', errors);
      partyIds.push(partyId);
    }
  }
  if (!id || !email || revoked === undefined) return fail(errors);
  const invite: DoorInvite = { id, email, partyIds, revoked };
  if (userId) invite.userId = userId;
  return finish(errors, invite);
}

export function parseProduct(input: unknown): ParseResult<Product> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'name', 'image', 'alt', 'amount', 'currency', 'pickup', 'stockNote'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const name = requireString(read.value, 'name', errors);
  const image = requireString(read.value, 'image', errors);
  const alt = requireString(read.value, 'alt', errors);
  const amount = requireFinite(read.value, 'amount', errors);
  const currency = optionalString(read.value, 'currency', errors);
  const pickup = requireString(read.value, 'pickup', errors);
  const stockNote = requireString(read.value, 'stockNote', errors);
  if (!id || !name || !image || !alt || amount === undefined || !pickup || !stockNote) return fail(errors);
  const product: Product = { id, name, image, alt, amount, pickup, stockNote };
  if (currency) product.currency = currency;
  return finish(errors, product);
}

export function parseStockCount(input: unknown, refs: SchemaRefs = {}): ParseResult<StockCount> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['productId', 'size', 'count'], errors);
  rejectSensitive(read.value, errors);
  const productId = requireString(read.value, 'productId', errors);
  if (productId) requireRef(refs.productIds, productId, 'productId', errors);
  const size = parseEnum(read.value.size, stockSizes, 'size');
  if (!size.ok) errors.push(...size.errors);
  const count = requireInteger(read.value, 'count', errors, 0);
  if (!productId || !size.ok || count === undefined) return fail(errors);
  return finish(errors, { productId, size: size.value, count });
}

export function parseStockCorrection(input: unknown, refs: SchemaRefs = {}): ParseResult<StockCorrection> {
  const read = readRecord(input);
  if (!read.ok) return read;
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'productId', 'size', 'actorId', 'at', 'oldCount', 'newCount'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const productId = requireString(read.value, 'productId', errors);
  if (productId) requireRef(refs.productIds, productId, 'productId', errors);
  const size = parseEnum(read.value.size, stockSizes, 'size');
  if (!size.ok) errors.push(...size.errors);
  const actorId = requireString(read.value, 'actorId', errors);
  if (actorId) requireRef(refs.profileIds, actorId, 'actorId', errors);
  const at = requireString(read.value, 'at', errors);
  const oldCount = requireInteger(read.value, 'oldCount', errors, 0);
  const newCount = requireInteger(read.value, 'newCount', errors, 0);
  if (!id || !productId || !size.ok || !actorId || !at || oldCount === undefined || newCount === undefined) return fail(errors);
  return finish(errors, { id, productId, size: size.value, actorId, at, oldCount, newCount });
}
