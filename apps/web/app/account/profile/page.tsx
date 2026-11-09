import { redirect } from 'next/navigation';
import { hasVerifiedClaims } from '../../../src/account/cognito-actions';
import { ProfileSetupScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  if (!(await hasVerifiedClaims())) {
    redirect('/account/sign-in');
  }
  return <ProfileSetupScreen initialNotice={knownAccountNotice(params.notice)} />;
}
