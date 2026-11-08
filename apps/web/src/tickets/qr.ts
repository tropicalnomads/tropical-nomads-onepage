import QRCode from 'qrcode';
import { qrPayloadText } from 'tropical-nomads-shared';

const ink = '#111827';
const cream = '#FFF8E7';

export async function ticketQrSvg(payload: unknown): Promise<string> {
  const text = qrPayloadText(payload);
  if (!text.ok) {
    throw new Error('ticket was not shown');
  }
  const svg = await QRCode.toString(text.value, {
    type: 'svg',
    margin: 1,
    width: 280,
    errorCorrectionLevel: 'M',
    color: { dark: ink, light: cream },
  });
  const start = svg.indexOf('<svg');
  if (start < 0) {
    throw new Error('ticket was not shown');
  }
  const body = svg.slice(start);
  if (/<script|javascript:/i.test(body) || body.includes(text.value)) {
    throw new Error('ticket was not shown');
  }
  return body.replace('<svg', '<svg role="presentation" focusable="false"');
}
