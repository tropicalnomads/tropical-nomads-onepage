'use client';

import { SignInForm } from '../../../src/components/AccountForms';
import { accountText } from '../../../src/i18n/copy';
import { useLanguage } from '../../../src/i18n/provider';

export default function SignInPage() {
  const { language } = useLanguage();
  return (
    <main>
      <section className="px-5 py-8 md:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{accountText(language, 'signInTitle')}</h1>
          <p className="mt-2 text-sm text-ozora-cream/75">{accountText(language, 'intro')}</p>
          <SignInForm />
          <p className="mt-6 text-sm text-ozora-cream/70">
            <a href="/account/register" className="text-ozora-turquoise underline-offset-2 hover:underline">
              {accountText(language, 'register')}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
