import { cookies } from 'next/headers';
import { accountCanPurchase } from 'tropical-nomads-shared';
import { readAccounts } from 'tropical-nomads-api/accounts';
import { adminTraceRows, listPaymentMethods, listTraces, readTraces } from 'tropical-nomads-api/payments';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { AccountHome, type AccountSummary } from '../../src/components/AccountHome';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AccountPage() {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const stored = readAccounts();
  const profile = stored.profiles.find((item) => item.sub === sub);
  const own = profile?.role === 'user' ? { role: 'user' as const, actorId: profile.sub } : undefined;
  const billingId = profile?.billingAddressId;
  const billing = billingId ? stored.billingAddresses.find((address) => address.id === billingId) : undefined;
  const summary: AccountSummary | null = profile
    ? {
        username: profile.username,
        givenName: profile.givenName,
        familyName: profile.familyName,
        email: profile.email,
        status: profile.status,
        canPay: accountCanPurchase(profile),
        hasAvatar: Boolean(profile.avatarKey),
        billing: billing ? { recipientName: billing.recipientName, country: billing.country } : null,
        methods: own
          ? listPaymentMethods(stored, own, profile.sub).map((method) => ({
              id: method.id,
              type: method.type,
              brand: method.brand,
              last4: method.last4,
              expiryMonth: method.expiryMonth,
              expiryYear: method.expiryYear,
            }))
          : [],
        traces: own
          ? listTraces(own, readTraces(), profile.sub).map((trace) => ({
              id: trace.id,
              amount: trace.amount,
              currency: trace.currency,
              purpose: trace.purpose,
            }))
          : [],
        teamTraces:
          profile.role === 'admin' && profile.status === 'active'
            ? adminTraceRows({ role: 'admin', actorId: profile.sub }, readTraces(), stored.profiles).map((trace) => ({
                id: trace.id,
                username: trace.username,
                amount: trace.amount,
                currency: trace.currency,
                purpose: trace.purpose,
              }))
            : null,
      }
    : null;
  return <AccountHome profile={summary} />;
}
