import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { profileSetupHref, signInHref } from '../../../src/account/return-path';
import { readSessionSub, sessionCookieName } from '../../../src/account/session';
import { currentAccounts } from '../../../src/remote-store';
import { ShopCheckout, type ShopAddressPreset } from '../../../src/components/ShopCheckout';
import type { ShopAddress } from '../../../src/shop/order';
import { canonicalCountryName } from '../../../src/shop/postal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function countryName(value: string | undefined): string {
  return canonicalCountryName(value ?? '');
}

export default async function ShopCheckoutPage() {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  if (!sub) {
    redirect(signInHref('/shop/checkout'));
  }
  const accounts = await currentAccounts();
  if (!accounts.profiles.some((item) => item.sub === sub)) {
    redirect(profileSetupHref('/shop/checkout'));
  }
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
