import { cookies } from 'next/headers';
import { readAccounts } from 'tropical-nomads-api/accounts';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { AccountHome, type AccountSummary } from '../../src/components/AccountHome';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AccountPage() {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const stored = readAccounts();
  const profile = stored.profiles.find((item) => item.sub === sub);
  const summary: AccountSummary | null = profile
    ? {
        username: profile.username,
        givenName: profile.givenName,
        familyName: profile.familyName,
        email: profile.email,
        status: profile.status,
        paymentMethods: stored.paymentMethods.filter((method) => method.userId === profile.sub).length,
      }
    : null;
  return <AccountHome profile={summary} />;
}
