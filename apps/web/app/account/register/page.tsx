import { redirect } from 'next/navigation';
import { hasVerifiedClaims } from '../../../src/account/cognito-actions';
import { readCognitoConfig } from '../../../src/account/cognito';
import { profileSetupHref } from '../../../src/account/return-path';
import { RegisterScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ notice?: string; next?: string }> }) {
  const params = await searchParams;
  if (await hasVerifiedClaims()) {
    redirect(profileSetupHref(params.next));
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
