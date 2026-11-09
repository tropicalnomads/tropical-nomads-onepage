import { randomBytes } from 'node:crypto';
import {
  accountCanScan,
  decideAccess,
  normalizeAccountEmail,
  parseCheckIn,
  parseDoorInvite,
  parseGuestList,
  parsePaymentTrace,
  parseQrPayload,
  ticketSecretMatches,
  type CheckIn,
  type DoorInvite,
  type DoorInviteScope,
  type GuestList,
  type IssuedTicket,
  type Order,
  type PaymentTrace,
  type Profile,
  type Role,
} from 'tropical-nomads-shared';
import { loadAccounts, readAccounts, writeAccounts, type AccountFile } from './accounts.ts';
import { usingDatabase } from './database.ts';
import { operationalDirectory, readOperational, updateOperational } from './operational.ts';
import { loadTraces } from './payments.ts';
import { queueDatabase, readStoredCollection, writeStoredCollection, writeStoredState } from './sql-store.ts';
import { loadIssuedTickets, readIssuedTickets, readOrders } from './tickets.ts';

export interface CheckInCaller {
  role: Role;
  actorId: string;
}

export interface SoldRow {
  ticketId: string;
  name: string;
  offerName: string;
  state: 'unpaid' | 'checked' | 'open';
}

export interface GuestRow {
  guestId: string;
  listId: string;
  listName: string;
  name: string;
  state: 'checked' | 'open';
}

export interface RosterList {
  id: string;
  name: string;
}

export interface EventRoster {
  partyId: string;
  sold: SoldRow[];
  guests: GuestRow[];
  lists: RosterList[];
}

export interface CheckInOutcome {
  admitted: boolean;
  reason?: CheckIn['reason'];
  checkIn?: CheckIn;
}

export interface InviteChange {
  file: AccountFile;
  invites: DoorInvite[];
}

const nameLimit = 80;

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(9).toString('hex')}`;
}

function cleanName(value: string): string {
  const name = value.trim();
  if (name === '' || name.length > nameLimit || /[\u0000-\u001f]/.test(name)) {
    throw new Error('name is not valid');
  }
  return name;
}

function sameEmail(left: string, right: string): boolean {
  return normalizeAccountEmail(left) === normalizeAccountEmail(right);
}

function scopeFor(caller: CheckInCaller, invites: readonly DoorInvite[]): DoorInviteScope | undefined {
  const active = invites.filter((invite) => !invite.revoked && invite.userId === caller.actorId);
  if (active.length === 0) {
    return undefined;
  }
  return { partyIds: [...new Set(active.flatMap((invite) => [...invite.partyIds]))], revoked: false };
}

function staffProfile(file: AccountFile, caller: CheckInCaller): Profile {
  const profile = file.profiles.find((item) => item.sub === caller.actorId);
  if (!profile || profile.status !== 'active' || profile.role !== caller.role) {
    throw new Error('check-in is not allowed');
  }
  if (caller.role === 'door' && !accountCanScan(profile)) {
    throw new Error('check-in is not allowed');
  }
  if (caller.role === 'admin' && profile.role !== 'admin') {
    throw new Error('check-in is not allowed');
  }
  if (caller.role === 'user') {
    throw new Error('check-in is not allowed');
  }
  return profile;
}

function published(partyId: string, partyIds: readonly string[]): void {
  if (!partyIds.includes(partyId)) {
    throw new Error('event is not published');
  }
}

function requireAdmin(caller: CheckInCaller): void {
  const decision = decideAccess({ action: 'create-guest-list', role: caller.role, actorId: caller.actorId });
  if (decision.effect !== 'allow' || decision.actorId !== caller.actorId) {
    throw new Error('check-in is not allowed');
  }
}

export function syncInvites(file: AccountFile, invites: readonly DoorInvite[], now: string): InviteChange {
  const nextInvites = invites.map((invite) => ({ ...invite, partyIds: [...invite.partyIds] }));
  const profiles = file.profiles.map((profile) => ({ ...profile, providers: [...profile.providers] }));
  for (const invite of nextInvites) {
    if (invite.revoked) {
      continue;
    }
    const profile = profiles.find((item) => item.emailVerified && item.status === 'active' && sameEmail(item.email, invite.email));
    if (!profile) {
      continue;
    }
    if (!invite.userId) {
      invite.userId = profile.sub;
    }
    if (profile.role === 'user') {
      profile.role = 'door';
      profile.updatedAt = now;
    }
  }
  for (const profile of profiles) {
    if (profile.role !== 'door') {
      continue;
    }
    const active = nextInvites.some((invite) => !invite.revoked && (invite.userId === profile.sub || sameEmail(invite.email, profile.email)));
    if (!active) {
      profile.role = 'user';
      profile.updatedAt = now;
    }
  }
  return { file: { ...file, profiles }, invites: nextInvites };
}

export function inviteDoor(
  file: AccountFile,
  invites: readonly DoorInvite[],
  caller: CheckInCaller,
  email: string,
  partyIds: readonly string[],
  publishedPartyIds: readonly string[],
  now: string,
): InviteChange {
  staffProfile(file, caller);
  const decision = decideAccess({ action: 'invite-door', role: caller.role, actorId: caller.actorId });
  if (decision.effect !== 'allow') {
    throw new Error('check-in is not allowed');
  }
  const normalized = normalizeAccountEmail(email);
  if (!normalized.includes('@') || normalized.startsWith('@') || normalized.endsWith('@')) {
    throw new Error('email is not an email');
  }
  const unique = [...new Set(partyIds.map((partyId) => partyId.trim()).filter((partyId) => partyId !== ''))];
  if (unique.length === 0 || unique.some((partyId) => !publishedPartyIds.includes(partyId))) {
    throw new Error('event is not published');
  }
  const draft = { id: newId('invite'), email: normalized, partyIds: unique, revoked: false };
  const parsed = parseDoorInvite(draft, { partyIds: publishedPartyIds });
  if (!parsed.ok) {
    throw new Error('invite was not stored');
  }
  return syncInvites(file, [...invites, parsed.value], now);
}

export function revokeDoor(
  file: AccountFile,
  invites: readonly DoorInvite[],
  caller: CheckInCaller,
  inviteId: string,
  now: string,
): InviteChange {
  staffProfile(file, caller);
  const decision = decideAccess({ action: 'revoke-door', role: caller.role, actorId: caller.actorId });
  if (decision.effect !== 'allow') {
    throw new Error('check-in is not allowed');
  }
  if (!invites.some((invite) => invite.id === inviteId)) {
    throw new Error('invite was not stored');
  }
  const next = invites.map((invite) => (invite.id === inviteId ? { ...invite, revoked: true } : invite));
  return syncInvites(file, next, now);
}

export function createGuestList(
  file: AccountFile,
  lists: readonly GuestList[],
  caller: CheckInCaller,
  partyId: string,
  name: string,
  publishedPartyIds: readonly string[],
  now: string,
): GuestList[] {
  staffProfile(file, caller);
  requireAdmin(caller);
  published(partyId, publishedPartyIds);
  const draft = { id: newId('list'), partyId, name: cleanName(name), createdAt: now, guests: [] };
  const parsed = parseGuestList(draft, { partyIds: publishedPartyIds });
  if (!parsed.ok) {
    throw new Error('guest list was not stored');
  }
  return [...lists, parsed.value];
}

export function addGuest(
  file: AccountFile,
  lists: readonly GuestList[],
  caller: CheckInCaller,
  listId: string,
  name: string,
  publishedPartyIds: readonly string[],
  now: string,
): GuestList[] {
  staffProfile(file, caller);
  const decision = decideAccess({ action: 'add-guest', role: caller.role, actorId: caller.actorId });
  if (decision.effect !== 'allow') {
    throw new Error('check-in is not allowed');
  }
  const list = lists.find((item) => item.id === listId);
  if (!list) {
    throw new Error('guest list was not stored');
  }
  published(list.partyId, publishedPartyIds);
  const guest = { id: newId('guest'), name: cleanName(name), addedAt: now };
  const parsed = parseGuestList({ ...list, guests: [...list.guests, guest] }, { partyIds: publishedPartyIds });
  if (!parsed.ok) {
    throw new Error('guest was not stored');
  }
  return lists.map((item) => (item.id === listId ? parsed.value : item));
}

function buyerNames(profile: Profile | undefined): string[] {
  if (!profile) {
    return [];
  }
  const names = [`${profile.givenName} ${profile.familyName}`, profile.username];
  if (profile.displayName) {
    names.push(profile.displayName);
  }
  return names.map((name) => name.trim()).filter((name) => name !== '');
}

function offerFor(ticket: IssuedTicket, orders: readonly Order[]): string {
  const order = orders.find((item) => item.traceId === ticket.traceId && item.userId === ticket.buyerId);
  const line = order?.lines.find((item) => item.kind === 'ticket' && item.partyId === ticket.partyId);
  return line !== undefined && line.kind === 'ticket' ? line.offerName : '';
}

function ticketChecked(checkIns: readonly CheckIn[], ticketId: string): boolean {
  return checkIns.some((row) => row.ticketId === ticketId && row.result === 'accepted');
}

function guestChecked(checkIns: readonly CheckIn[], guestId: string): boolean {
  return checkIns.some((row) => row.guestId === guestId && row.result === 'accepted');
}

export function eventRoster(
  file: AccountFile,
  invites: readonly DoorInvite[],
  lists: readonly GuestList[],
  tickets: readonly IssuedTicket[],
  orders: readonly Order[],
  traces: readonly PaymentTrace[],
  checkIns: readonly CheckIn[],
  caller: CheckInCaller,
  partyId: string,
  publishedPartyIds: readonly string[],
): EventRoster {
  staffProfile(file, caller);
  published(partyId, publishedPartyIds);
  const decision = decideAccess({
    action: 'read-event-roster',
    role: caller.role,
    actorId: caller.actorId,
    partyId,
    invite: scopeFor(caller, invites),
  });
  if (decision.effect !== 'allow') {
    throw new Error('check-in is not allowed');
  }
  const sold = tickets
    .filter((ticket) => ticket.partyId === partyId)
    .map((ticket) => {
      const profile = file.profiles.find((item) => item.sub === ticket.buyerId);
      const names = buyerNames(profile);
      const trace = traces.find((item) => item.id === ticket.traceId);
      const checked = ticketChecked(checkIns, ticket.id);
      const state: SoldRow['state'] = checked ? 'checked' : !trace || trace.status !== 'confirmed' ? 'unpaid' : 'open';
      return {
        ticketId: ticket.id,
        name: names[0] ?? '',
        offerName: offerFor(ticket, orders),
        state,
      };
    });
  const guests = lists
    .filter((list) => list.partyId === partyId)
    .flatMap((list) =>
      list.guests.map((guest) => ({
        guestId: guest.id,
        listId: list.id,
        listName: list.name,
        name: guest.name,
        state: guestChecked(checkIns, guest.id) ? ('checked' as const) : ('open' as const),
      })),
    );
  const listRows = lists.filter((list) => list.partyId === partyId).map((list) => ({ id: list.id, name: list.name }));
  return { partyId, sold, guests, lists: listRows };
}

export function searchRoster(roster: EventRoster, query: string, file: AccountFile, tickets: readonly IssuedTicket[]): EventRoster {
  const needle = query.trim().toLowerCase();
  if (needle === '' || needle.length > nameLimit) {
    return { partyId: roster.partyId, sold: [], guests: [], lists: roster.lists };
  }
  const sold = roster.sold.filter((row) => {
    const ticket = tickets.find((item) => item.id === row.ticketId);
    const profile = ticket ? file.profiles.find((item) => item.sub === ticket.buyerId) : undefined;
    return buyerNames(profile).some((name) => name.toLowerCase().includes(needle));
  });
  const guests = roster.guests.filter((row) => row.name.toLowerCase().includes(needle) || row.listName.toLowerCase().includes(needle));
  return { partyId: roster.partyId, sold, guests, lists: roster.lists };
}

function storeCheckIn(
  checkIns: readonly CheckIn[],
  draft: {
    partyId: string;
    actorId: string;
    at: string;
    result: 'accepted' | 'refused';
    reason?: CheckIn['reason'];
    ticketId?: string;
    guestId?: string;
  },
  refs: { partyIds: readonly string[]; profileIds: readonly string[]; ticketIds?: readonly string[]; guestIds?: readonly string[] },
): CheckIn[] {
  const parsed = parseCheckIn({ id: newId('checkin'), ...draft }, refs);
  if (!parsed.ok) {
    throw new Error('check-in was not stored');
  }
  return [...checkIns, parsed.value];
}

function outcome(checkIns: readonly CheckIn[], admitted: boolean, reason?: CheckIn['reason']): CheckInOutcome {
  const checkIn = checkIns[checkIns.length - 1];
  return { admitted, ...(reason ? { reason } : {}), ...(checkIn ? { checkIn } : {}) };
}

export function checkInTicket(
  file: AccountFile,
  invites: readonly DoorInvite[],
  tickets: readonly IssuedTicket[],
  traces: readonly PaymentTrace[],
  checkIns: readonly CheckIn[],
  caller: CheckInCaller,
  partyId: string,
  ticketId: string,
  publishedPartyIds: readonly string[],
  now: string,
): { checkIns: CheckIn[]; outcome: CheckInOutcome } {
  const profile = staffProfile(file, caller);
  published(partyId, publishedPartyIds);
  const allowed = decideAccess({
    action: 'scan-ticket',
    role: caller.role,
    actorId: caller.actorId,
    partyId,
    invite: scopeFor(caller, invites),
  });
  const ticket = tickets.find((item) => item.id === ticketId);
  const refs = {
    partyIds: publishedPartyIds,
    profileIds: file.profiles.map((item) => item.sub),
    ticketIds: tickets.map((item) => item.id),
  };
  if (allowed.effect !== 'allow' || !ticket || ticket.partyId !== partyId) {
    if (caller.role === 'user' || !ticket) {
      throw new Error('check-in is not allowed');
    }
    const next = storeCheckIn(checkIns, { partyId, actorId: profile.sub, at: now, result: 'refused', reason: 'wrong party', ticketId: ticket?.id ?? ticketId }, refs);
    return { checkIns: next, outcome: outcome(next, false, 'wrong party') };
  }
  if (ticketChecked(checkIns, ticket.id)) {
    const next = storeCheckIn(checkIns, { partyId, actorId: profile.sub, at: now, result: 'refused', reason: 'already used', ticketId }, refs);
    return { checkIns: next, outcome: outcome(next, false, 'already used') };
  }
  const trace = traces.find((item) => item.id === ticket.traceId);
  if (!trace || trace.status !== 'confirmed') {
    const next = storeCheckIn(checkIns, { partyId, actorId: profile.sub, at: now, result: 'refused', reason: 'unpaid', ticketId }, refs);
    return { checkIns: next, outcome: outcome(next, false, 'unpaid') };
  }
  const next = storeCheckIn(checkIns, { partyId, actorId: profile.sub, at: now, result: 'accepted', ticketId }, refs);
  return { checkIns: next, outcome: outcome(next, true) };
}

export function checkInGuest(
  file: AccountFile,
  invites: readonly DoorInvite[],
  lists: readonly GuestList[],
  checkIns: readonly CheckIn[],
  caller: CheckInCaller,
  partyId: string,
  guestId: string,
  publishedPartyIds: readonly string[],
  now: string,
): { checkIns: CheckIn[]; outcome: CheckInOutcome } {
  const profile = staffProfile(file, caller);
  published(partyId, publishedPartyIds);
  const allowed = decideAccess({
    action: 'scan-ticket',
    role: caller.role,
    actorId: caller.actorId,
    partyId,
    invite: scopeFor(caller, invites),
  });
  const guest = lists.filter((list) => list.partyId === partyId).flatMap((list) => list.guests).find((item) => item.id === guestId);
  const guestIds = lists.flatMap((list) => list.guests.map((item) => item.id));
  const refs = {
    partyIds: publishedPartyIds,
    profileIds: file.profiles.map((item) => item.sub),
    guestIds,
  };
  if (allowed.effect !== 'allow' || !guest) {
    if (caller.role === 'user' || !guest) {
      throw new Error('check-in is not allowed');
    }
    const next = storeCheckIn(
      checkIns,
      { partyId, actorId: profile.sub, at: now, result: 'refused', reason: 'wrong party', ...(guest ? { guestId: guest.id } : {}) },
      refs,
    );
    return { checkIns: next, outcome: outcome(next, false, 'wrong party') };
  }
  if (guestChecked(checkIns, guest.id)) {
    const next = storeCheckIn(checkIns, { partyId, actorId: profile.sub, at: now, result: 'refused', reason: 'already used', guestId }, refs);
    return { checkIns: next, outcome: outcome(next, false, 'already used') };
  }
  const next = storeCheckIn(checkIns, { partyId, actorId: profile.sub, at: now, result: 'accepted', guestId }, refs);
  return { checkIns: next, outcome: outcome(next, true) };
}

export function scanTicket(
  file: AccountFile,
  invites: readonly DoorInvite[],
  tickets: readonly IssuedTicket[],
  traces: readonly PaymentTrace[],
  checkIns: readonly CheckIn[],
  caller: CheckInCaller,
  partyId: string,
  payload: unknown,
  publishedPartyIds: readonly string[],
  now: string,
): { checkIns: CheckIn[]; outcome: CheckInOutcome } {
  staffProfile(file, caller);
  published(partyId, publishedPartyIds);
  const parsed = parseQrPayload(payload);
  if (!parsed.ok) {
    return { checkIns: [...checkIns], outcome: { admitted: false, reason: 'unknown' } };
  }
  const ticket = tickets.find((item) => item.id === parsed.value.id);
  if (!ticket || !ticketSecretMatches(ticket.secret, parsed.value.secret)) {
    if (!ticket || caller.role === 'user') {
      return { checkIns: [...checkIns], outcome: { admitted: false, reason: 'unknown' } };
    }
    const profile = file.profiles.find((item) => item.sub === caller.actorId);
    const refs = {
      partyIds: publishedPartyIds,
      profileIds: file.profiles.map((item) => item.sub),
      ticketIds: tickets.map((item) => item.id),
    };
    if (!profile) {
      throw new Error('check-in is not allowed');
    }
    const next = storeCheckIn(
      checkIns,
      { partyId, actorId: profile.sub, at: now, result: 'refused', reason: 'unknown', ticketId: ticket.id },
      refs,
    );
    return { checkIns: next, outcome: outcome(next, false, 'unknown') };
  }
  return checkInTicket(file, invites, tickets, traces, checkIns, caller, partyId, ticket.id, publishedPartyIds, now);
}

function storedInvites(records: readonly unknown[]): DoorInvite[] {
  return records.map((record) => {
    const parsed = parseDoorInvite(record);
    if (!parsed.ok) {
      throw new Error('invite was not stored');
    }
    return parsed.value;
  });
}

function storedLists(records: readonly unknown[]): GuestList[] {
  return records.map((record) => {
    const parsed = parseGuestList(record);
    if (!parsed.ok) {
      throw new Error('guest list was not stored');
    }
    return parsed.value;
  });
}

function storedCheckIns(records: readonly unknown[]): CheckIn[] {
  return records.map((record) => {
    const parsed = parseCheckIn(record);
    if (!parsed.ok) {
      throw new Error('check-in was not stored');
    }
    return parsed.value;
  });
}

function storedTraces(records: readonly unknown[]): PaymentTrace[] {
  return records.map((record) => {
    const parsed = parsePaymentTrace(record);
    if (!parsed.ok) {
      throw new Error('payment trace is not pending');
    }
    return parsed.value;
  });
}

export function readGuestLists(root = operationalDirectory()): GuestList[] {
  return storedLists(readOperational('guest-lists', root).records);
}

export function readDoorInvites(root = operationalDirectory()): DoorInvite[] {
  return storedInvites(readOperational('door-invites', root).records);
}

export function readCheckIns(root = operationalDirectory()): CheckIn[] {
  return storedCheckIns(readOperational('check-ins', root).records);
}

export async function loadDoorInvites(root?: string): Promise<DoorInvite[]> {
  if (usingDatabase(root)) {
    return storedInvites((await readStoredCollection('door-invites')).records);
  }
  return readDoorInvites(root ?? operationalDirectory());
}

export async function loadGuestLists(root?: string): Promise<GuestList[]> {
  if (usingDatabase(root)) {
    return storedLists((await readStoredCollection('guest-lists')).records);
  }
  return readGuestLists(root ?? operationalDirectory());
}

export async function loadCheckIns(root?: string): Promise<CheckIn[]> {
  if (usingDatabase(root)) {
    return storedCheckIns((await readStoredCollection('check-ins')).records);
  }
  return readCheckIns(root ?? operationalDirectory());
}

export function commitInvite(
  caller: CheckInCaller,
  email: string,
  partyIds: readonly string[],
  publishedPartyIds: readonly string[],
  now: string,
  root?: string,
): Promise<DoorInvite> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const changed = inviteDoor(await loadAccounts(), await loadDoorInvites(), caller, email, partyIds, publishedPartyIds, now);
      const inviteId = changed.invites[changed.invites.length - 1]?.id ?? '';
      await writeStoredState({
        accounts: changed.file,
        collections: { 'door-invites': { schemaVersion: 1, records: changed.invites } },
      });
      const invite = (await loadDoorInvites()).find((item) => item.id === inviteId);
      if (!invite) {
        throw new Error('invite was not stored');
      }
      return invite;
    });
  }
  const directory = root ?? operationalDirectory();
  let inviteId = '';
  return updateOperational(
    'door-invites',
    (current) => {
      const invites = current.records.map((record) => {
        const parsed = parseDoorInvite(record);
        if (!parsed.ok) {
          throw new Error('invite was not stored');
        }
        return parsed.value;
      });
      const changed = inviteDoor(readAccounts(directory), invites, caller, email, partyIds, publishedPartyIds, now);
      writeAccounts(changed.file, directory);
      inviteId = changed.invites[changed.invites.length - 1]?.id ?? '';
      return { schemaVersion: 1, records: changed.invites };
    },
    directory,
  ).then((file) => {
    const invite = file.records
      .map((record) => {
        const parsed = parseDoorInvite(record);
        if (!parsed.ok) {
          throw new Error('invite was not stored');
        }
        return parsed.value;
      })
      .find((item) => item.id === inviteId);
    if (!invite) {
      throw new Error('invite was not stored');
    }
    return invite;
  });
}

export function visibleEvents(caller: CheckInCaller, invites: readonly DoorInvite[], publishedPartyIds: readonly string[]): string[] {
  if (caller.role === 'admin') {
    return [...publishedPartyIds];
  }
  if (caller.role === 'door') {
    const scope = scopeFor(caller, invites);
    return publishedPartyIds.filter((partyId) => scope?.partyIds.includes(partyId));
  }
  return [];
}

export function commitScan(
  caller: CheckInCaller,
  partyId: string,
  payload: unknown,
  publishedPartyIds: readonly string[],
  now: string,
  root?: string,
): Promise<CheckInOutcome> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const scanned = scanTicket(
        await loadAccounts(),
        await loadDoorInvites(),
        await loadIssuedTickets(),
        await loadTraces(),
        await loadCheckIns(),
        caller,
        partyId,
        payload,
        publishedPartyIds,
        now,
      );
      await writeStoredCollection('check-ins', { schemaVersion: 1, records: scanned.checkIns });
      return scanned.outcome;
    });
  }
  const directory = root ?? operationalDirectory();
  let outcomeResult: CheckInOutcome = { admitted: false, reason: 'unknown' };
  return updateOperational(
    'check-ins',
    (current) => {
      const scanned = scanTicket(
        readAccounts(directory),
        readDoorInvites(directory),
        readIssuedTickets(directory),
        storedTraces(readOperational('payment-traces', directory).records),
        storedCheckIns(current.records),
        caller,
        partyId,
        payload,
        publishedPartyIds,
        now,
      );
      outcomeResult = scanned.outcome;
      return { schemaVersion: 1, records: scanned.checkIns };
    },
    directory,
  ).then(() => outcomeResult);
}

export function commitGuestList(
  caller: CheckInCaller,
  partyId: string,
  name: string,
  publishedPartyIds: readonly string[],
  now: string,
  root?: string,
): Promise<GuestList> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const lists = createGuestList(await loadAccounts(), await loadGuestLists(), caller, partyId, name, publishedPartyIds, now);
      const listId = lists[lists.length - 1]?.id ?? '';
      await writeStoredCollection('guest-lists', { schemaVersion: 1, records: lists });
      const list = (await loadGuestLists()).find((item) => item.id === listId);
      if (!list) {
        throw new Error('guest list was not stored');
      }
      return list;
    });
  }
  const directory = root ?? operationalDirectory();
  let listId = '';
  return updateOperational(
    'guest-lists',
    (current) => {
      const lists = createGuestList(readAccounts(directory), storedLists(current.records), caller, partyId, name, publishedPartyIds, now);
      listId = lists[lists.length - 1]?.id ?? '';
      return { schemaVersion: 1, records: lists };
    },
    directory,
  ).then((file) => {
    const list = storedLists(file.records).find((item) => item.id === listId);
    if (!list) {
      throw new Error('guest list was not stored');
    }
    return list;
  });
}

export function commitAddGuest(
  caller: CheckInCaller,
  listId: string,
  name: string,
  publishedPartyIds: readonly string[],
  now: string,
  root?: string,
): Promise<GuestList> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const lists = addGuest(await loadAccounts(), await loadGuestLists(), caller, listId, name, publishedPartyIds, now);
      await writeStoredCollection('guest-lists', { schemaVersion: 1, records: lists });
      const list = (await loadGuestLists()).find((item) => item.id === listId);
      if (!list) {
        throw new Error('guest was not stored');
      }
      return list;
    });
  }
  const directory = root ?? operationalDirectory();
  return updateOperational(
    'guest-lists',
    (current) => ({
      schemaVersion: 1,
      records: addGuest(readAccounts(directory), storedLists(current.records), caller, listId, name, publishedPartyIds, now),
    }),
    directory,
  ).then((file) => {
    const list = storedLists(file.records).find((item) => item.id === listId);
    if (!list) {
      throw new Error('guest was not stored');
    }
    return list;
  });
}

export function commitGuestCheckIn(
  caller: CheckInCaller,
  partyId: string,
  guestId: string,
  publishedPartyIds: readonly string[],
  now: string,
  root?: string,
): Promise<CheckInOutcome> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const checked = checkInGuest(
        await loadAccounts(),
        await loadDoorInvites(),
        await loadGuestLists(),
        await loadCheckIns(),
        caller,
        partyId,
        guestId,
        publishedPartyIds,
        now,
      );
      await writeStoredCollection('check-ins', { schemaVersion: 1, records: checked.checkIns });
      return checked.outcome;
    });
  }
  const directory = root ?? operationalDirectory();
  let outcomeResult: CheckInOutcome = { admitted: false, reason: 'unknown' };
  return updateOperational(
    'check-ins',
    (current) => {
      const checked = checkInGuest(
        readAccounts(directory),
        readDoorInvites(directory),
        readGuestLists(directory),
        storedCheckIns(current.records),
        caller,
        partyId,
        guestId,
        publishedPartyIds,
        now,
      );
      outcomeResult = checked.outcome;
      return { schemaVersion: 1, records: checked.checkIns };
    },
    directory,
  ).then(() => outcomeResult);
}

export function commitTicketCheckIn(
  caller: CheckInCaller,
  partyId: string,
  ticketId: string,
  publishedPartyIds: readonly string[],
  now: string,
  root?: string,
): Promise<CheckInOutcome> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const checked = checkInTicket(
        await loadAccounts(),
        await loadDoorInvites(),
        await loadIssuedTickets(),
        await loadTraces(),
        await loadCheckIns(),
        caller,
        partyId,
        ticketId,
        publishedPartyIds,
        now,
      );
      await writeStoredCollection('check-ins', { schemaVersion: 1, records: checked.checkIns });
      return checked.outcome;
    });
  }
  const directory = root ?? operationalDirectory();
  let outcomeResult: CheckInOutcome = { admitted: false, reason: 'unknown' };
  return updateOperational(
    'check-ins',
    (current) => {
      const checked = checkInTicket(
        readAccounts(directory),
        readDoorInvites(directory),
        readIssuedTickets(directory),
        storedTraces(readOperational('payment-traces', directory).records),
        storedCheckIns(current.records),
        caller,
        partyId,
        ticketId,
        publishedPartyIds,
        now,
      );
      outcomeResult = checked.outcome;
      return { schemaVersion: 1, records: checked.checkIns };
    },
    directory,
  ).then(() => outcomeResult);
}

export function rosterFor(
  caller: CheckInCaller,
  partyId: string,
  publishedPartyIds: readonly string[],
  root = operationalDirectory(),
): EventRoster {
  return eventRoster(
    readAccounts(root),
    readDoorInvites(root),
    readGuestLists(root),
    readIssuedTickets(root),
    readOrders(root),
    storedTraces(readOperational('payment-traces', root).records),
    readCheckIns(root),
    caller,
    partyId,
    publishedPartyIds,
  );
}
