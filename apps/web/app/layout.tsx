import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import '@fontsource-variable/outfit';
import { adminActor } from '../src/admin/actions';
import { readSessionSub, sessionCookieName } from '../src/account/session';
import { brandStyleText } from '../src/brand';
import { ShellFooter } from '../src/components/ShellFooter';
import { ShellHeader } from '../src/components/ShellHeader';
import { LanguageProvider } from '../src/i18n/provider';
import { rootMetadata, siteViewport } from '../src/seo/metadata';
import { PublicSearchLinks } from '../src/seo/links';
import { localeFromHeader } from '../src/seo/urls';
import './globals.css';

export const metadata = rootMetadata;

export const viewport = siteViewport;

// Extensions such as McAfee WebAdvisor stamp attributes onto buttons before
// hydration. next/script beforeInteractive only queues this and yields a task
// before hydrate(), so the stamp lands in that gap and React logs the tree.
// A parser-run script starts the observer first and removes the attributes.
const stripExtensionAttributes = `(function () {
  var names = ['cz-shortcut-listen', 'fdprocessedid', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
  var selector = '[' + names.join('],[') + ']';
  function strip(node) {
    if (!node || node.nodeType !== 1) return;
    for (var i = 0; i !== names.length; i++) {
      if (node.hasAttribute(names[i])) node.removeAttribute(names[i]);
    }
  }
  function stripTree(root) {
    strip(root);
    if (!root.querySelectorAll) return;
    var nodes = root.querySelectorAll(selector);
    for (var i = 0; i !== nodes.length; i++) strip(nodes[i]);
  }
  var root = document.documentElement;
  var observer = new MutationObserver(function (records) {
    for (var i = 0; i !== records.length; i++) {
      var record = records[i];
      if (record.type === 'attributes') strip(record.target);
      var added = record.addedNodes;
      for (var j = 0; added && j !== added.length; j++) {
        if (added[j].nodeType === 1) stripTree(added[j]);
      }
    }
  });
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: names });
  stripTree(root);
  window.addEventListener('load', function () {
    stripTree(root);
    observer.disconnect();
  }, { once: true });
})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const headerList = await headers();
  const urlLanguage = localeFromHeader(headerList.get('x-tn-locale'));
  const initialLanguage = urlLanguage ?? 'en';
  const signedIn = readSessionSub(jar.get(sessionCookieName)?.value) !== undefined;
  let admin = false;
  if (signedIn) {
    try {
      admin = (await adminActor()) !== undefined;
    } catch {
      admin = false;
    }
  }
  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: stripExtensionAttributes }} />
        <style>{brandStyleText()}</style>
        <PublicSearchLinks />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <LanguageProvider initialLanguage={initialLanguage}>
          <div className="flex min-h-dvh flex-col">
            <ShellHeader signedIn={signedIn} admin={admin} />
            {children}
            <ShellFooter />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
