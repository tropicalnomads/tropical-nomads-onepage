import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { canonicalCountryName, countryCodeFromInput } from '../../../src/shop/postal';

interface NominatimResult {
  address?: {
    city?: string;
    country?: string;
    country_code?: string;
    county?: string;
    house_number?: string;
    municipality?: string;
    pedestrian?: string;
    postcode?: string;
    region?: string;
    road?: string;
    state?: string;
    town?: string;
    village?: string;
  };
}

interface ZippopotamResult {
  'post code'?: string;
  places?: Array<{
    'place name'?: string;
    state?: string;
  }>;
}

interface LookupBody {
  city: string;
  country: string;
  line1: string;
  postalCode: string;
  region: string;
}

const lookupHeaders = {
  Accept: 'application/json',
  'Accept-Language': 'en',
  'User-Agent': 'TropicalNomadsShop/1.0 (https://tropical-nomads.com)',
};

const distinctiveFormats: readonly { code: string; pattern: RegExp }[] = [
  { code: 'PT', pattern: /^\d{4}-\d{3}$/ },
  { code: 'BR', pattern: /^\d{5}-\d{3}$/ },
  { code: 'JP', pattern: /^\d{3}-\d{4}$/ },
  { code: 'NL', pattern: /^\d{4}\s*[A-Za-z]{2}$/ },
  { code: 'CA', pattern: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s*\d[ABCEGHJ-NPRSTV-Z]\d$/i },
  { code: 'GB', pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i },
  { code: 'IE', pattern: /^[AC-FHKNPRTV-Y]\d{2}\s*[AC-FHKNPRTV-Y0-9]{4}$/i },
];

function formatCountry(postalCode: string): string | undefined {
  return distinctiveFormats.find((entry) => entry.pattern.test(postalCode.trim()))?.code;
}

function streetLine(address: NonNullable<NominatimResult['address']>): string {
  return [address.house_number, address.road ?? address.pedestrian].filter((part) => part && part.trim() !== '').join(' ');
}

function useful(body: LookupBody): boolean {
  return body.city !== '' || body.region !== '' || body.country !== '' || body.line1 !== '';
}

async function fromZippopotam(countryCode: string, postalCode: string): Promise<LookupBody | undefined> {
  const response = await fetch(`https://api.zippopotam.us/${countryCode.toUpperCase()}/${encodeURIComponent(postalCode)}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 86_400 },
  });
  if (!response.ok) {
    return undefined;
  }
  const postal = (await response.json()) as ZippopotamResult;
  const place = postal.places?.[0];
  if (!place) {
    return undefined;
  }
  const body: LookupBody = {
    city: place['place name']?.trim() ?? '',
    region: place.state?.trim() ?? '',
    postalCode: postal['post code']?.trim() || postalCode,
    country: canonicalCountryName(countryCode),
    line1: '',
  };
  return useful(body) ? body : undefined;
}

async function fromNominatim(postalCode: string, countryCode: string | undefined): Promise<(LookupBody & { countryCode?: string }) | undefined> {
  const query = new URLSearchParams({
    addressdetails: '1',
    format: 'jsonv2',
    limit: '8',
    postalcode: postalCode,
  });
  if (countryCode) {
    query.set('countrycodes', countryCode.toLowerCase());
  }
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
    headers: lookupHeaders,
    next: { revalidate: 86_400 },
  });
  if (!response.ok) {
    return undefined;
  }
  const results = (await response.json()) as NominatimResult[];
  const countryCodes = new Set(
    results.flatMap((result) => {
      const code = result.address?.country_code?.trim().toUpperCase();
      return code ? [code] : [];
    }),
  );
  if (!countryCode && countryCodes.size !== 1) {
    return undefined;
  }
  const address = results.find((result) => result.address?.country_code)?.address ?? results[0]?.address;
  if (!address) {
    return undefined;
  }
  const code = address.country_code?.trim().toUpperCase();
  const body: LookupBody & { countryCode?: string } = {
    city: (address.city ?? address.town ?? address.village ?? address.municipality ?? '').trim(),
    region: (address.state ?? address.region ?? address.county ?? '').trim(),
    postalCode: address.postcode?.trim() || postalCode,
    country: canonicalCountryName(code || address.country || ''),
    line1: streetLine(address),
    ...(code ? { countryCode: code } : {}),
  };
  return useful(body) ? body : undefined;
}

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get('postalCode')?.trim().slice(0, 24) ?? '';
  if (postalCode.length < 3 || !/^[\p{L}\p{N} -]+$/u.test(postalCode)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const countryParam = request.nextUrl.searchParams.get('country') ?? '';
  const hinted = countryCodeFromInput(countryParam) ?? (countryParam.trim() === '' ? formatCountry(postalCode) : undefined);

  try {
    if (hinted) {
      const zipped = await fromZippopotam(hinted, postalCode);
      if (zipped) {
        return NextResponse.json(zipped);
      }
    }
    const mapped = await fromNominatim(postalCode, hinted);
    if (!mapped) {
      return NextResponse.json({ error: 'not-found' }, { status: 404 });
    }
    if (!hinted && mapped.countryCode) {
      const refined = await fromZippopotam(mapped.countryCode, mapped.postalCode || postalCode);
      if (refined) {
        return NextResponse.json({
          ...refined,
          country: refined.country || mapped.country,
          line1: refined.line1 || mapped.line1,
        });
      }
    }
    return NextResponse.json({
      city: mapped.city,
      country: mapped.country,
      line1: mapped.line1,
      postalCode: mapped.postalCode,
      region: mapped.region,
    });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
