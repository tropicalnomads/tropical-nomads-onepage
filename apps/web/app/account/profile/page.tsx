import { redirect } from 'next/navigation';
import { splitPersonName } from 'tropical-nomads-shared';
import { readVerifiedClaims } from '../../../src/account/cognito-actions';
import { googlePictureUrl } from '../../../src/account/google-picture';
import { signInHref } from '../../../src/account/return-path';
import { ProfileSetupScreen } from '../../../src/components/AccountForms';
import { knownAccountNotice } from '../../../src/i18n/copy';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string; next?: string }> }) {
  const params = await searchParams;
  const claims = await readVerifiedClaims();
  if (!claims) {
    redirect(signInHref(params.next));
  }
  const names = splitPersonName({ givenName: claims.givenName, familyName: claims.familyName, fullName: claims.fullName });
  const displayName = (claims.fullName || `${names.givenName} ${names.familyName}`).trim().slice(0, 80);
  return (
    <ProfileSetupScreen
      initialNotice={knownAccountNotice(params.notice)}
      email={claims.email}
      previewUrl={googlePictureUrl(claims.pictureUrl)}
      values={{
        givenName: names.givenName,
        familyName: names.familyName,
        ...(displayName !== '' ? { displayName } : {}),
      }}
    />
  );
}
