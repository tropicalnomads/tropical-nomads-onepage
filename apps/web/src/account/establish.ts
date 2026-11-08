import { normalizeAccountEmail, type VerifiedSignIn } from 'tropical-nomads-shared';
import { publishedEventIds, registerVerifiedAccount, updateAccounts } from 'tropical-nomads-api/accounts';

export async function establishVerifiedAccount(
  signIn: VerifiedSignIn,
  env: { INITIAL_ADMIN_SUB?: string } = { INITIAL_ADMIN_SUB: process.env.INITIAL_ADMIN_SUB },
  root?: string,
): Promise<string> {
  const now = new Date().toISOString();
  const email = normalizeAccountEmail(signIn.email);
  let sub = '';
  await updateAccounts((current) => {
    const next = registerVerifiedAccount(current, signIn, publishedEventIds(), now, env);
    const profile = next.profiles.find((item) => item.sub === signIn.sub || normalizeAccountEmail(item.email) === email);
    sub = profile?.sub ?? '';
    if (sub === '') {
      throw new Error('account was not saved');
    }
    return next;
  }, root);
  return sub;
}
