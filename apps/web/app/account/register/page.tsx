import { redirect } from 'next/navigation';
import { hasVerifiedClaims } from '../../../src/account/cognito-actions';
import { readCognitoConfig } from '../../../src/account/cognito';
import { RegisterScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  if (await hasVerifiedClaims()) {
    redirect('/account/profile');
  }
  const config = readCognitoConfig();
  return (
    <RegisterScreen
      hosted={config !== undefined}
      google={config?.google ?? false}
      apple={config?.apple ?? false}
      initialNotice={knownAccountNotice(params.notice)}
    />
  );
}
