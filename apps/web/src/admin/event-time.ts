export function wallClock(iso: string, timeZone: string): { date: string; time: string } {
  const instant = new Date(iso);
  if (iso.trim() === '' || Number.isNaN(instant.getTime())) {
    return { date: '', time: '' };
  }
  const zone = timeZone.trim() === '' ? 'UTC' : timeZone.trim();
  try {
    return partsOf(instant, zone);
  } catch {
    return partsOf(instant, 'UTC');
  }
}

function partsOf(instant: Date, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const hour = pick('hour') === '24' ? '00' : pick('hour');
  return { date: `${pick('year')}-${pick('month')}-${pick('day')}`, time: `${hour}:${pick('minute')}` };
}

function zoneOffset(utcMillis: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMillis));
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const hour = pick('hour') === 24 ? 0 : pick('hour');
  const asUtc = Date.UTC(pick('year'), pick('month') - 1, pick('day'), hour, pick('minute'), pick('second'));
  return asUtc - utcMillis;
}

export function instantFromWall(date: string, time: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return '';
  }
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (!year || !month || !day || hour === undefined || minute === undefined || Number.isNaN(hour) || Number.isNaN(minute)) {
    return '';
  }
  const zone = timeZone.trim() === '' ? 'UTC' : timeZone.trim();
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  try {
    const first = wall - zoneOffset(wall, zone);
    const utc = wall - zoneOffset(first, zone);
    return new Date(utc).toISOString();
  } catch {
    return new Date(wall).toISOString();
  }
}
