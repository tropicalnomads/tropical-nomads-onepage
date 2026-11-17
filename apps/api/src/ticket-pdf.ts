import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import { formatEventDate, knownTimeZone, qrPayloadText, type Locale } from 'tropical-nomads-shared';

const navy = rgb(0.016, 0.184, 0.18);
const ink = rgb(0.067, 0.09, 0.12);
const muted = rgb(0.38, 0.4, 0.42);
const cream = rgb(1, 0.973, 0.906);
const pageWidth = 595.28;
const pageHeight = 841.89;

export interface TicketDocument {
  id: string;
  secret: string;
  title: string;
  offerName: string;
  ownerName: string;
  language: Locale;
  dateStart?: string;
  timezone?: string;
  durationHours?: number;
  venueName?: string;
  address?: string;
  city?: string;
  country?: string;
}

function safe(value: string): string {
  return value.normalize('NFC').replace(/[^\u0020-\u00ff]/g, '').trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/).filter((word) => word !== '');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current === '' ? word : `${current} ${word}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current !== '') {
      lines.push(current);
    }
    current = word;
  }
  if (current !== '') {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

function logoBytes(): Buffer | undefined {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, '../assets/tropical-nomads-logo-horizontal-cream.png'),
    join(process.cwd(), 'public/branding/tropical-nomads-logo-horizontal-cream.png'),
    join(process.cwd(), 'apps/web/public/branding/tropical-nomads-logo-horizontal-cream.png'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path);
    }
  }
  return undefined;
}

function clock(date: Date, language: Locale, zone: string | undefined): string {
  return new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-IE', {
    hour: '2-digit',
    minute: '2-digit',
    ...(zone ? { timeZone: zone } : {}),
  }).format(date);
}

function timeValue(input: TicketDocument): string {
  if (!input.dateStart) {
    return '';
  }
  const start = new Date(input.dateStart);
  if (Number.isNaN(start.getTime())) {
    return '';
  }
  const zone = knownTimeZone(input.timezone);
  const opening = clock(start, input.language, zone);
  if (input.durationHours === undefined || !Number.isFinite(input.durationHours) || input.durationHours <= 0) {
    return opening;
  }
  const finish = new Date(start.getTime() + input.durationHours * 3_600_000);
  return `${opening} - ${clock(finish, input.language, zone)}`;
}

function dateValue(input: TicketDocument): string {
  if (!input.dateStart) {
    return '';
  }
  return formatEventDate(
    { dateStart: input.dateStart, ...(input.timezone ? { timezone: input.timezone } : {}) },
    input.language === 'pt' ? 'pt-PT' : 'en-IE',
  );
}

function labels(language: Locale): { date: string; time: string; place: string; address: string; ticket: string; name: string; door: string } {
  switch (language) {
    case 'en':
      return { date: 'Date', time: 'Hours', place: 'Place', address: 'Address', ticket: 'Ticket', name: 'Name', door: 'Show this at the door' };
    case 'pt':
      return { date: 'Data', time: 'Horário', place: 'Local', address: 'Endereço', ticket: 'Ingresso', name: 'Nome', door: 'Apresente na entrada' };
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

function facts(input: TicketDocument): { label: string; value: string }[] {
  const copy = labels(input.language);
  const place = [input.venueName, input.city, input.country].filter((part) => part !== undefined && part.trim() !== '').join(', ');
  const address = input.address?.trim() ?? '';
  const rows = [
    { label: copy.date, value: dateValue(input) },
    { label: copy.time, value: timeValue(input) },
    { label: copy.place, value: place },
    { label: copy.address, value: address },
    { label: copy.ticket, value: input.offerName },
    { label: copy.name, value: input.ownerName },
  ];
  return rows.filter((row) => row.value.trim() !== '');
}

function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>): void {
  const shown = safe(text);
  if (shown === '') {
    return;
  }
  page.drawText(shown, { x, y, size, font, color });
}

/** One A4 door ticket. The secret is only inside the QR. */
export async function buildTicketPdf(input: TicketDocument): Promise<Uint8Array> {
  const payload = qrPayloadText({ id: input.id, secret: input.secret });
  if (!payload.ok) {
    throw new Error('ticket was not built');
  }
  const doc = await PDFDocument.create();
  const page = doc.addPage([pageWidth, pageHeight]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: 0, y: pageHeight - 108, width: pageWidth, height: 108, color: navy });
  const logo = logoBytes();
  if (logo) {
    const image = await doc.embedPng(logo);
    const logoHeight = 36;
    const logoWidth = (image.width / image.height) * logoHeight;
    page.drawImage(image, { x: 48, y: pageHeight - 74, width: logoWidth, height: logoHeight });
  } else {
    drawText(page, 'Tropical Nomads', 48, pageHeight - 68, 18, bold, cream);
  }

  let y = pageHeight - 148;
  for (const line of wrap(input.title, bold, 26, pageWidth - 96).slice(0, 3)) {
    drawText(page, line, 48, y, 26, bold, ink);
    y -= 32;
  }
  y -= 10;
  for (const row of facts(input)) {
    drawText(page, row.label.toUpperCase(), 48, y, 9, bold, muted);
    y -= 16;
    for (const line of wrap(row.value, font, 14, pageWidth - 96).slice(0, 3)) {
      drawText(page, line, 48, y, 14, font, ink);
      y -= 18;
    }
    y -= 10;
  }

  const png = await QRCode.toBuffer(payload.value, {
    type: 'png',
    margin: 1,
    width: 280,
    errorCorrectionLevel: 'M',
    color: { dark: '#111827', light: '#FFF8E7' },
  });
  const qr = await doc.embedPng(png);
  const qrSize = 210;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 118;
  page.drawRectangle({ x: qrX - 14, y: qrY - 14, width: qrSize + 28, height: qrSize + 28, color: cream });
  page.drawImage(qr, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  const door = labels(input.language).door;
  drawText(page, door, (pageWidth - font.widthOfTextAtSize(safe(door), 12)) / 2, 84, 12, font, ink);
  drawText(page, input.id, (pageWidth - font.widthOfTextAtSize(safe(input.id), 9)) / 2, 52, 9, font, muted);
  return doc.save();
}
