import { cookies } from 'next/headers';
import { accountEmail, pendingEmailCookie } from '../../../src/account/review';
import { ConfirmEmailScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; email?: string; change?: string }>;
}) {
  const params = await searchParams;
  const fromQuery = accountEmail(params.email);
  const fromCookie = params.change === '1' ? undefined : accountEmail((await cookies()).get(pendingEmailCookie)?.value);
  return <ConfirmEmailScreen email={fromQuery ?? fromCookie ?? ''} initialNotice={knownAccountNotice(params.notice)} />;
}
