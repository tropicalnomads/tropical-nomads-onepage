import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { IssuedTicket } from 'tropical-nomads-shared';

export function hashTicketSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export function ticketQrKey(env: NodeJS.ProcessEnv = process.env): Buffer {
  const raw = env.TICKET_QR_KEY?.trim() ?? '';
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error('ticket key is missing');
  }
  return Buffer.from(raw, 'hex');
}

export function sealTicketSecret(secret: string, key = ticketQrKey()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function openTicketSecret(box: string, key = ticketQrKey()): string {
  const bytes = Buffer.from(box, 'base64url');
  if (bytes.length < 29) {
    throw new Error('ticket was not stored');
  }
  const iv = bytes.subarray(0, 12);
  const tag = bytes.subarray(12, 28);
  const encrypted = bytes.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/** The stored secret is the hash. The box is the only copy that can redraw the QR. */
export function sealStoredTicket(ticket: IssuedTicket, key = ticketQrKey()): Record<string, unknown> {
  return {
    id: ticket.id,
    partyId: ticket.partyId,
    traceId: ticket.traceId,
    buyerId: ticket.buyerId,
    secret: hashTicketSecret(ticket.secret),
    secretBox: sealTicketSecret(ticket.secret, key),
    createdAt: ticket.createdAt,
    validForEntry: ticket.validForEntry,
  };
}
