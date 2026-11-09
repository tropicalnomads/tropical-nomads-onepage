const regionCodes = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'XK',
  'YE', 'YT',
  'ZA', 'ZM', 'ZW',
] as const;

interface CountryRecord {
  code: string;
  name: string;
}

const englishNames = new Intl.DisplayNames(['en'], { type: 'region' });
const portugueseNames = new Intl.DisplayNames(['pt'], { type: 'region' });

function namedCountry(code: string): CountryRecord | undefined {
  const name = englishNames.of(code);
  if (!name || name.toUpperCase() === code) {
    return undefined;
  }
  return { code, name };
}

const countries: readonly CountryRecord[] = regionCodes.flatMap((code) => {
  const country = namedCountry(code);
  return country ? [country] : [];
});

const codeByName = new Map<string, string>();
for (const country of countries) {
  codeByName.set(country.code.toLowerCase(), country.code);
  codeByName.set(country.name.toLowerCase(), country.code);
  const local = portugueseNames.of(country.code);
  if (local) {
    codeByName.set(local.toLowerCase(), country.code);
  }
}
for (const [alias, code] of [
  ['uk', 'GB'],
  ['great britain', 'GB'],
  ['britain', 'GB'],
  ['usa', 'US'],
  ['u.s.', 'US'],
  ['u.s.a.', 'US'],
  ['holland', 'NL'],
  ['the netherlands', 'NL'],
] as const) {
  codeByName.set(alias, code);
}

const choiceCache = new Map<string, { value: string; label: string }[]>();

export function countryCodeFromInput(value: string): string | undefined {
  const key = value.trim().toLowerCase();
  if (key === '') {
    return undefined;
  }
  return codeByName.get(key);
}

export function canonicalCountryName(value: string): string {
  const trimmed = value.trim();
  const code = countryCodeFromInput(trimmed);
  if (!code) {
    return trimmed;
  }
  return countries.find((country) => country.code === code)?.name ?? trimmed;
}

export function countryChoices(language: string): { value: string; label: string }[] {
  const locale = language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  const cached = choiceCache.get(locale);
  if (cached) {
    return cached;
  }
  const labels = locale === 'pt' ? portugueseNames : englishNames;
  const seen = new Set<string>();
  const choices = countries.flatMap((country) => {
    if (seen.has(country.name)) {
      return [];
    }
    seen.add(country.name);
    return [{ value: country.name, label: labels.of(country.code) ?? country.name }];
  }).sort((left, right) => left.label.localeCompare(right.label, locale));
  choiceCache.set(locale, choices);
  return choices;
}

export function postalCompact(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]/g, '');
}

export function postalLookupKey(postalCode: string, country: string): string {
  return `${postalCompact(postalCode)}|${canonicalCountryName(country).toLowerCase()}`;
}
