import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEmailSend, type Locale } from 'tropical-nomads-shared';
import { readPartyCatalog } from './catalog.ts';
import { usingDatabase } from './database.ts';
import { operationalDirectory } from './operational.ts';
import { publishedEventsFrom } from './published.ts';
import { insertEmailSend, readStoredCatalog } from './sql-store.ts';
import { buildTicketPdf, type TicketDocument } from './ticket-pdf.ts';

export interface TicketMailTicket {
  id: string;
  partyId?: string;
  ownerName?: string;
  ownerEmail?: string;
  secret: string;
}

export interface TicketMailFile {
  filename: string;
  pdf: Buffer;
}

export interface TicketMailMessage {
  to: string;
  subject: string;
  text: string;
  files: TicketMailFile[];
}

export interface TicketMailInput {
  tickets: readonly TicketMailTicket[];
  title: string;
  offerName: string;
  language: Locale;
  now?: string;
  root?: string;
  env?: NodeJS.ProcessEnv;
  deliver?: (message: TicketMailMessage) => Promise<void>;
}

function subjectFor(language: Locale, title: string): string {
  switch (language) {
    case 'en':
      return `Your ticket for ${title}`;
    case 'pt':
      return `Seu ingresso para ${title}`;
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

function closingFor(language: Locale, count: number): string {
  switch (language) {
    case 'en':
      return count === 1 ? 'Your ticket is attached.' : 'Your tickets are attached.';
    case 'pt':
      return count === 1 ? 'O ingresso está em anexo.' : 'Os ingressos estão em anexo.';
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

async function eventPlace(partyId: string | undefined): Promise<Partial<TicketDocument>> {
  if (!partyId) {
    return {};
  }
  try {
    const events = usingDatabase() ? publishedEventsFrom(await readStoredCatalog('events')).events : readPartyCatalog().events;
    const event = events.find((item) => item.id === partyId);
    if (!event) {
      return {};
    }
    const venue: Record<string, unknown> =
      typeof event.venue === 'object' && event.venue !== null && !Array.isArray(event.venue)
        ? (event.venue as Record<string, unknown>)
        : {};
    const venueName = textField(venue.name);
    const address = textField(venue.address);
    const city = textField(venue.city);
    const country = textField(venue.country);
    return {
      title: event.title,
      dateStart: event.dateStart,
      ...(event.timezone ? { timezone: event.timezone } : {}),
      ...(typeof event.durationHours === 'number' ? { durationHours: event.durationHours } : {}),
      ...(venueName ? { venueName } : {}),
      ...(address ? { address } : {}),
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
    };
  } catch {
    return {};
  }
}

function rememberFile(send: { id: string; templateId: string; recipient: string; language: string; purpose: string; at: string }, root?: string): void {
  const directory = root ?? operationalDirectory();
  mkdirSync(directory, { recursive: true });
  const path = join(directory, 'email-sends.json');
  const current = existsSync(path)
    ? (JSON.parse(readFileSync(path, 'utf8')) as { records?: unknown[] })
    : { schemaVersion: 1, records: [] };
  const records = Array.isArray(current.records) ? current.records : [];
  records.push(send);
  writeFileSync(path, `${JSON.stringify({ schemaVersion: 1, records }, null, 2)}\n`, 'utf8');
}

interface RecordedSend {
  id: string;
  templateId: 'ticket-purchase';
  recipient: string;
  language: Locale;
  purpose: 'ticket-purchase';
  at: string;
}

async function remember(send: RecordedSend, root?: string): Promise<void> {
  const parsed = parseEmailSend(send);
  if (!parsed.ok) {
    throw new Error('email was not recorded');
  }
  if (usingDatabase(root)) {
    await insertEmailSend(parsed.value);
    return;
  }
  rememberFile(parsed.value, root);
}

async function deliverSes(from: string, message: TicketMailMessage): Promise<void> {
  const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2');
  const boundary = `tn-${randomBytes(8).toString('hex')}`;
  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
  ];
  for (const file of message.files) {
    parts.push(
      `--${boundary}`,
      'Content-Type: application/pdf',
      `Content-Disposition: attachment; filename="${file.filename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      file.pdf.toString('base64'),
    );
  }
  parts.push(`--${boundary}--`, '');
  const raw = Buffer.from(
    [
      `From: ${from}`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      ...parts,
    ].join('\r\n'),
  );
  const client = new SESv2Client({});
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [message.to] },
      Content: { Raw: { Data: raw } },
    }),
  );
}

/**
 * One message per holder email. Each message carries only that address's tickets.
 * Returns the addresses that were not delivered. A failed send does not undo the tickets.
 */
export async function notifyTicketHolders(input: TicketMailInput): Promise<string[]> {
  const language = input.language;
  const now = input.now ?? new Date().toISOString();
  const env = input.env ?? process.env;
  const from = env.TICKET_MAIL_FROM?.trim() ?? '';
  const groups = new Map<string, TicketMailTicket[]>();
  for (const ticket of input.tickets) {
    const email = ticket.ownerEmail?.trim().toLowerCase() ?? '';
    if (email === '' || !email.includes('@')) {
      continue;
    }
    const current = groups.get(email) ?? [];
    current.push(ticket);
    groups.set(email, current);
  }
  const unsent: string[] = [];
  for (const [email, tickets] of groups) {
    const send: RecordedSend = {
      id: `send-${randomBytes(9).toString('hex')}`,
      templateId: 'ticket-purchase',
      recipient: email,
      language,
      purpose: 'ticket-purchase',
      at: now,
    };
    const lines = tickets.map((ticket) => `${ticket.ownerName ?? email} — ${input.offerName}`);
    const text = [`${input.title}`, ...lines, closingFor(language, tickets.length)].join('\n');
    let delivered = false;
    try {
      if (input.deliver !== undefined || from !== '') {
        const place = await eventPlace(tickets[0]?.partyId);
        const files: TicketMailFile[] = [];
        for (let index = 0; index < tickets.length; index += 1) {
          const ticket = tickets[index];
          if (!ticket) {
            continue;
          }
          const pdf = await buildTicketPdf({
            id: ticket.id,
            secret: ticket.secret,
            title: place.title ?? input.title,
            offerName: input.offerName,
            ownerName: ticket.ownerName ?? email,
            language,
            ...(place.dateStart ? { dateStart: place.dateStart } : {}),
            ...(place.timezone ? { timezone: place.timezone } : {}),
            ...(place.durationHours !== undefined ? { durationHours: place.durationHours } : {}),
            ...(place.venueName ? { venueName: place.venueName } : {}),
            ...(place.address ? { address: place.address } : {}),
            ...(place.city ? { city: place.city } : {}),
            ...(place.country ? { country: place.country } : {}),
          });
          files.push({ filename: `ticket-${index + 1}.pdf`, pdf: Buffer.from(pdf) });
        }
        const message: TicketMailMessage = { to: email, subject: subjectFor(language, input.title), text, files };
        if (input.deliver) {
          await input.deliver(message);
        } else {
          await deliverSes(from, message);
        }
        delivered = true;
      }
    } catch {
      delivered = false;
    }
    if (!delivered) {
      unsent.push(email);
    }
    try {
      await remember(send, input.root);
    } catch {
      // The tickets stay issued. A missed record does not take back a sent message.
    }
  }
  return unsent;
}
