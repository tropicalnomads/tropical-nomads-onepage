import { redirect } from 'next/navigation';
import { hasVerifiedClaims } from '../../../src/account/cognito-actions';
import { signInHref } from '../../../src/account/return-path';
import { ProfileSetupScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string; next?: string }> }) {
  const params = await searchParams;
  if (!(await hasVerifiedClaims())) {
    redirect(signInHref(params.next));
  }
  return <ProfileSetupScreen initialNotice={knownAccountNotice(params.notice)} />;
}
