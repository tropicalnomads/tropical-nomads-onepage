export interface PlaceMatch {
  id: string;
  name: string;
  city: string;
}

const cityZones: Record<string, string> = {
  florianopolis: 'America/Sao_Paulo',
  saopaulo: 'America/Sao_Paulo',
  riodejaneiro: 'America/Sao_Paulo',
  brasilia: 'America/Sao_Paulo',
  recife: 'America/Recife',
  manaus: 'America/Manaus',
  belem: 'America/Belem',
  fortaleza: 'America/Fortaleza',
};

export function placeKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** Dublin matches Europe/Dublin. A city with no zone of its own uses a known fallback. */
export function timezoneForCity(city: string): string | undefined {
  const key = placeKey(city);
  if (key === '') {
    return undefined;
  }
  const fallback = cityZones[key];
  const zones = Intl.supportedValuesOf('timeZone');
  if (fallback && zones.includes(fallback)) {
    return fallback;
  }
  return zones.find((zone) => placeKey(zone.split('/').at(-1) ?? '') === key);
}

export function venueIdFor(venues: readonly PlaceMatch[], current: { id: string; name: string; city: string }): string {
  if (current.id !== '' && venues.some((venue) => venue.id === current.id)) {
    return current.id;
  }
  const name = placeKey(current.name);
  if (name === '') {
    return '';
  }
  const named = venues.filter((venue) => placeKey(venue.name) === name);
  if (named.length === 1) {
    return named[0]?.id ?? '';
  }
  const city = placeKey(current.city);
  return named.find((venue) => placeKey(venue.city) === city)?.id ?? '';
}

/** The morning after a calendar date, at 03:00, without crossing a timezone. */
export function followingMorning(date: string): { date: string; time: string } | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return undefined;
  }
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(next.getUTCDate()).padStart(2, '0');
  return { date: `${next.getUTCFullYear()}-${nextMonth}-${nextDay}`, time: '03:00' };
}
