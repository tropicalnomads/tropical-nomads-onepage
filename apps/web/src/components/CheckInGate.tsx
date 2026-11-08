'use client';

import { accountText, areaText, checkInText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';

export function CheckInGate({ signedIn }: { signedIn: boolean }) {
  const { language } = useLanguage();
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
            <a href="/account/sign-in" className="mt-4 inline-flex rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink">
              {accountText(language, 'signIn')}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
