'use client';

import { useSignInHref } from '../account/use-return-path';
import { accountText, areaText, checkInText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';
import { Button } from './ui/Button';

export function CheckInGate({ signedIn }: { signedIn: boolean }) {
  const { language } = useLanguage();
  const signInHref = useSignInHref();
  return (
    <section className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{areaText(language, 'check-in')}</h1>
        <div className="mt-6">
          <EmptyState
            title={checkInText(language, signedIn ? 'deniedTitle' : 'signInTitle')}
            description={checkInText(language, signedIn ? 'deniedBody' : 'signInBody')}
          />
          {signedIn ? null : (
            <Button href={signInHref} className="mt-4">
              {accountText(language, 'signIn')}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
