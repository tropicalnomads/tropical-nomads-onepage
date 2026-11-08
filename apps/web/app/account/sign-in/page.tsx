import { readCognitoConfig } from '../../../src/account/cognito';
import { SignInScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const config = readCognitoConfig();
  return (
    <SignInScreen
      hosted={config !== undefined}
      google={config?.google ?? false}
      apple={config?.apple ?? false}
      initialNotice={knownAccountNotice(params.notice)}
    />
  );
}
