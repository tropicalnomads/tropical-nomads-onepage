import { cookies } from 'next/headers';
import { readAccounts } from 'tropical-nomads-api/accounts';
import { readSessionSub, sessionCookieName } from '../../../src/account/session';
import { ShopCheckout, type ShopAddressPreset } from '../../../src/components/ShopCheckout';
import type { ShopAddress } from '../../../src/shop/order';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function countryName(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'ie' || normalized === 'ireland' || normalized === 'irlanda') return 'Ireland';
  if (normalized === 'pt' || normalized === 'portugal') return 'Portugal';
  if (normalized === 'gb' || normalized === 'uk' || normalized === 'united kingdom' || normalized === 'reino unido') return 'United Kingdom';
  if (normalized === 'de' || normalized === 'germany' || normalized === 'alemanha') return 'Germany';
  return value?.trim() ?? '';
}

export default async function ShopCheckoutPage() {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const accounts = readAccounts();
  const profile = accounts.profiles.find((item) => item.sub === sub && item.status === 'active');
  const saved = profile?.billingAddressId
    ? accounts.billingAddresses.find((address) => address.id === profile.billingAddressId)
    : undefined;
  const presets: ShopAddressPreset[] = [];
  if (saved) {
    presets.push({
      kind: 'saved',
      address: {
        name: saved.recipientName,
        line1: saved.line1,
        line2: saved.line2 ?? '',
        city: saved.city,
        region: saved.region,
        postalCode: saved.postalCode,
        country: countryName(saved.country),
      },
    });
  }
  if (profile) {
    const profileAddress: ShopAddress = {
      name: `${profile.givenName} ${profile.familyName}`.trim(),
      line1: '',
      line2: '',
      city: profile.city ?? '',
      region: profile.region ?? '',
      postalCode: profile.postalCode ?? '',
      country: countryName(profile.country),
    };
    if (Object.values(profileAddress).some((value) => value !== '')) {
      presets.push({ kind: 'profile', address: profileAddress });
    }
  }
  return (
    <main>
      <ShopCheckout presets={presets} signedIn={Boolean(profile)} />
    </main>
  );
}
