import { hasVerifiedClaims } from '../../../src/account/cognito-actions';
import { readCognitoConfig } from '../../../src/account/cognito';
import { RegisterScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const config = readCognitoConfig();
  const needsUsername = await hasVerifiedClaims();
  return (
    <RegisterScreen
      hosted={config !== undefined}
      google={config?.google ?? false}
      apple={config?.apple ?? false}
      needsUsername={needsUsername}
      initialNotice={knownAccountNotice(params.notice)}
    />
  );
}
