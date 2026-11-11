import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { currentAccounts } from '../../src/remote-store';
import { AccountHome, type AccountSummary } from '../../src/components/AccountHome';
import { knownAccountNotice } from '../../src/i18n/copy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const stored = await currentAccounts();
  const profile = stored.profiles.find((item) => item.sub === sub);
  if (sub && !profile) {
    redirect('/account/profile');
  }
  const summary: AccountSummary | null = profile
    ? {
        username: profile.username,
        givenName: profile.givenName,
        familyName: profile.familyName,
        displayName: profile.displayName,
        phone: profile.phone,
        city: profile.city,
        region: profile.region,
        postalCode: profile.postalCode,
        country: profile.country,
        email: profile.email,
        status: profile.status,
        hasAvatar: Boolean(profile.avatarKey),
      }
    : null;
  return <AccountHome profile={summary} initialNotice={knownAccountNotice(params.notice)} />;
}
