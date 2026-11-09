import { normalizeAccountEmail, type VerifiedSignIn } from 'tropical-nomads-shared';
import {
  loadAccounts,
  loadAvatar,
  loadPublishedEventIds,
  registerVerifiedAccount,
  saveAvatarKey,
  saveDefaultBillingAddress,
  saveProfileDetails,
  storeAvatarBytes,
  updateAccounts,
  type ProfileDetails,
} from './accounts.ts';
import {
  commitAddGuest,
  commitGuestCheckIn,
  commitGuestList,
  commitScan,
  commitTicketCheckIn,
  loadCheckIns,
  loadDoorInvites,
  loadGuestLists,
  type CheckInCaller,
} from './check-in.ts';
import { commitPayment, commitPaymentMethod, loadTraces, type PaymentCaller, type PaymentDraft } from './payments.ts';
import { openSealed, sessionFromCookie } from './session-token.ts';
import { commitTicket, loadIssuedTickets, loadOrders, loadPartyTitles, loadPublishedParties } from './tickets.ts';

export interface PrivateResponse {
  status: 200 | 400 | 401;
  body: { ok: boolean; result?: unknown; error?: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} was not accepted`);
  }
  return value;
}

function requireSubject(sessionSub: string | undefined, subject: string, required: boolean): void {
  if (required && sessionSub !== subject) {
    throw new Error('request was not accepted');
  }
  if (sessionSub !== undefined && sessionSub !== subject) {
    throw new Error('request was not accepted');
  }
}

function userCaller(value: unknown, sessionSub: string): PaymentCaller {
  if (!isRecord(value) || value.role !== 'user' || value.actorId !== sessionSub) {
    throw new Error('request was not accepted');
  }
  return { role: 'user', actorId: sessionSub };
}

function staffCaller(value: unknown, sessionSub: string): CheckInCaller {
  if (!isRecord(value) || value.actorId !== sessionSub || (value.role !== 'admin' && value.role !== 'door')) {
    throw new Error('request was not accepted');
  }
  return { role: value.role, actorId: sessionSub };
}

function profileDetails(value: unknown): ProfileDetails {
  if (!isRecord(value) || typeof value.givenName !== 'string' || typeof value.familyName !== 'string') {
    throw new Error('profile was not saved');
  }
  const details: ProfileDetails = { givenName: value.givenName, familyName: value.familyName };
  for (const key of ['displayName', 'phone', 'city', 'region', 'postalCode', 'country'] as const) {
    const field = value[key];
    if (typeof field === 'string' && field !== '') {
      details[key] = field;
    }
  }
  return details;
}

function avatarBytes(value: unknown): Uint8Array | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || value.length > 1_400_000) {
    throw new Error('avatar is not an image');
  }
  return new Uint8Array(Buffer.from(value, 'base64'));
}

async function saveProfile(sub: string, input: unknown): Promise<void> {
  if (!isRecord(input)) {
    throw new Error('profile was not saved');
  }
  const details = profileDetails(input.details);
  const bytes = avatarBytes(input.avatarBase64);
  const now = new Date().toISOString();
  const key = bytes ? await storeAvatarBytes(bytes) : undefined;
  await updateAccounts((current) => {
    const withDetails = saveProfileDetails(current, sub, details, now);
    return key ? saveAvatarKey(withDetails, sub, key, now) : withDetails;
  });
}

async function establish(input: unknown): Promise<string> {
  if (!isRecord(input) || !isRecord(input.signIn)) {
    throw new Error('account was not saved');
  }
  const signIn = input.signIn;
  if (typeof signIn.sub !== 'string' || typeof signIn.email !== 'string') {
    throw new Error('account was not saved');
  }
  const env = isRecord(input.env) && typeof input.env.INITIAL_ADMIN_SUB === 'string' ? { INITIAL_ADMIN_SUB: input.env.INITIAL_ADMIN_SUB } : {};
  const eventIds = await loadPublishedEventIds();
  const now = new Date().toISOString();
  const email = normalizeAccountEmail(signIn.email);
  let sub = '';
  await updateAccounts((current) => {
    const next = registerVerifiedAccount(current, signIn as unknown as VerifiedSignIn, eventIds, now, env);
    const profile = next.profiles.find((item) => item.sub === signIn.sub || normalizeAccountEmail(item.email) === email);
    sub = profile?.sub ?? '';
    if (sub === '') {
      throw new Error('account was not saved');
    }
    return next;
  });
  return sub;
}

async function snapshot(): Promise<unknown> {
  const titles = await loadPartyTitles();
  const [accounts, tickets, orders, invites, guestLists, checkIns, traces, parties, eventIds] = await Promise.all([
    loadAccounts(),
    loadIssuedTickets(),
    loadOrders(),
    loadDoorInvites(),
    loadGuestLists(),
    loadCheckIns(),
    loadTraces(),
    loadPublishedParties(),
    loadPublishedEventIds(),
  ]);
  return {
    accounts,
    tickets,
    orders,
    invites,
    guestLists,
    checkIns,
    traces,
    parties,
    eventIds,
    titles: [...titles.entries()],
  };
}

async function runAction(action: string, input: unknown, sessionSub: string | undefined): Promise<unknown> {
  switch (action) {
    case 'snapshot':
      return snapshot();
    case 'establish':
      return establish(input);
    case 'save-profile': {
      if (!isRecord(input)) {
        throw new Error('profile was not saved');
      }
      const sub = text(input.sub, 'profile');
      requireSubject(sessionSub, sub, input.requireSession === true);
      await saveProfile(sub, input);
      return { saved: true };
    }
    case 'save-avatar': {
      if (!isRecord(input)) {
        throw new Error('avatar is not an image');
      }
      const sub = text(input.sub, 'avatar');
      requireSubject(sessionSub, sub, true);
      const bytes = avatarBytes(input.avatarBase64);
      if (!bytes) {
        throw new Error('avatar is not an image');
      }
      const key = await storeAvatarBytes(bytes);
      await updateAccounts((current) => saveAvatarKey(current, sub, key, new Date().toISOString()));
      return { saved: true };
    }
    case 'save-billing': {
      if (!isRecord(input)) {
        throw new Error('billing address was not saved');
      }
      const sub = text(input.sub, 'billing');
      requireSubject(sessionSub, sub, true);
      await updateAccounts((current) => saveDefaultBillingAddress(current, sub, input.address, new Date().toISOString()));
      return { saved: true };
    }
    case 'save-method': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input)) {
        throw new Error('payment method is not a method');
      }
      await commitPaymentMethod(userCaller(input.caller, sub), sub, input.method);
      return { saved: true };
    }
    case 'pay': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input) || (input.purpose !== 'tickets' && input.purpose !== 'shop')) {
        throw new Error('payment is not allowed');
      }
      const draft = paymentDraft(input.input, sub);
      return commitPayment(input.purpose, draft, userCaller(input.caller, sub));
    }
    case 'issue-ticket': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input) || !isRecord(input.input)) {
        throw new Error('ticket was not issued');
      }
      return commitTicket({ partyId: text(input.input.partyId, 'ticket'), offerName: text(input.input.offerName, 'ticket') }, userCaller(input.caller, sub));
    }
    case 'scan': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input)) {
        throw new Error('check-in is not allowed');
      }
      return commitScan(staffCaller(input.caller, sub), text(input.partyId, 'check-in'), input.payload, await loadPublishedEventIds(), new Date().toISOString());
    }
    case 'check-in-ticket': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input)) {
        throw new Error('check-in is not allowed');
      }
      return commitTicketCheckIn(
        staffCaller(input.caller, sub),
        text(input.partyId, 'check-in'),
        text(input.ticketId, 'check-in'),
        await loadPublishedEventIds(),
        new Date().toISOString(),
      );
    }
    case 'check-in-guest': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input)) {
        throw new Error('check-in is not allowed');
      }
      return commitGuestCheckIn(
        staffCaller(input.caller, sub),
        text(input.partyId, 'check-in'),
        text(input.guestId, 'check-in'),
        await loadPublishedEventIds(),
        new Date().toISOString(),
      );
    }
    case 'create-guest-list': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input)) {
        throw new Error('guest list was not stored');
      }
      const caller = staffCaller(input.caller, sub);
      if (caller.role !== 'admin') {
        throw new Error('check-in is not allowed');
      }
      await commitGuestList(caller, text(input.partyId, 'guest list'), text(input.name, 'guest list'), await loadPublishedEventIds(), new Date().toISOString());
      return { saved: true };
    }
    case 'add-guest': {
      const sub = requireSignedIn(sessionSub);
      if (!isRecord(input)) {
        throw new Error('guest was not stored');
      }
      const caller = staffCaller(input.caller, sub);
      if (caller.role !== 'admin') {
        throw new Error('check-in is not allowed');
      }
      await commitAddGuest(caller, text(input.listId, 'guest'), text(input.name, 'guest'), await loadPublishedEventIds(), new Date().toISOString());
      return { saved: true };
    }
    case 'avatar': {
      const sub = requireSignedIn(sessionSub);
      const accounts = await loadAccounts();
      const profile = accounts.profiles.find((item) => item.sub === sub && item.status === 'active');
      const bytes = profile?.avatarKey ? await loadAvatar(profile.avatarKey) : undefined;
      return { bytes: bytes ? Buffer.from(bytes).toString('base64') : null, key: profile?.avatarKey ?? null };
    }
    default:
      throw new Error('request was not accepted');
  }
}

function requireSignedIn(sessionSub: string | undefined): string {
  if (!sessionSub) {
    throw new Error('request was not accepted');
  }
  return sessionSub;
}

function paymentDraft(value: unknown, userId: string): PaymentDraft {
  if (!isRecord(value) || typeof value.amount !== 'number' || typeof value.currency !== 'string' || typeof value.reference !== 'string') {
    throw new Error('payment is not allowed');
  }
  return {
    userId,
    amount: value.amount,
    currency: value.currency,
    reference: value.reference,
    ...(typeof value.status === 'string' && value.status !== '' ? { status: value.status } : {}),
  };
}

export async function handlePrivate(body: unknown, cookieHeader: string | undefined): Promise<PrivateResponse> {
  const token = isRecord(body) && typeof body.token === 'string' ? body.token : undefined;
  const sealed = openSealed(token);
  if (!isRecord(sealed) || typeof sealed.action !== 'string') {
    return { status: 401, body: { ok: false, error: 'request was not accepted' } };
  }
  try {
    const result = await runAction(sealed.action, sealed.input, sessionFromCookie(cookieHeader));
    return { status: 200, body: { ok: true, result } };
  } catch (error) {
    const message = error instanceof Error && error.message.trim() !== '' ? error.message : 'request failed';
    return { status: 400, body: { ok: false, error: message } };
  }
}
