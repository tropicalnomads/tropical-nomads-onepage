import { ForgotPasswordScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  return <ForgotPasswordScreen initialNotice={knownAccountNotice(params.notice)} />;
}
