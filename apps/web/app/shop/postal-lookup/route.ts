import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const countryCodes: Record<string, string> = {
  germany: 'de',
  ireland: 'ie',
  portugal: 'pt',
  'united kingdom': 'gb',
};

interface NominatimResult {
  address?: {
    city?: string;
    country?: string;
    county?: string;
    municipality?: string;
    postcode?: string;
    region?: string;
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

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get('postalCode')?.trim().slice(0, 24) ?? '';
  const country = request.nextUrl.searchParams.get('country')?.trim().toLowerCase() ?? '';
  const countryCode = countryCodes[country];
  if (!countryCode || postalCode.length < 3 || !/^[\p{L}\p{N} -]+$/u.test(postalCode)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  try {
    const postalResponse = await fetch(`https://api.zippopotam.us/${countryCode.toUpperCase()}/${encodeURIComponent(postalCode)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86_400 },
    });
    if (postalResponse.ok) {
      const postal = (await postalResponse.json()) as ZippopotamResult;
      const place = postal.places?.[0];
      if (place) {
        return NextResponse.json({
          city: place['place name'] ?? '',
          region: place.state ?? '',
          postalCode: postal['post code'] ?? postalCode,
        });
      }
    }

    const query = new URLSearchParams({
      addressdetails: '1',
      countrycodes: countryCode,
      format: 'jsonv2',
      limit: '1',
      postalcode: postalCode,
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TropicalNomadsShop/1.0 (https://tropical-nomads.com)',
      },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'unavailable' }, { status: 502 });
    }
    const results = (await response.json()) as NominatimResult[];
    const address = results[0]?.address;
    if (!address) {
      return NextResponse.json({ error: 'not-found' }, { status: 404 });
    }
    return NextResponse.json({
      city: address.city ?? address.town ?? address.village ?? address.municipality ?? '',
      region: address.state ?? address.region ?? address.county ?? '',
      postalCode: address.postcode ?? postalCode,
    });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
