import { browserAccountOrigin, googleStartRedirect, readCognitoConfig } from '../../../src/account/cognito';
import { beginHostedSignIn } from '../../../src/account/hosted-flow';
import { signInHref } from '../../../src/account/return-path';
import { withNoindex } from '../../../src/seo/headers.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function redirect(url: URL | string): Response {
  const response = withNoindex(Response.redirect(url));
  response.headers.set('cache-control', 'no-store');
  return response;
}

export async function GET(request: Request): Promise<Response> {
  const here = new URL(request.url);
  const next = here.searchParams.get('next') ?? '';
  const host = request.headers.get('host');
  const config = readCognitoConfig();
  if (!config) {
    const signIn = new URL(signInHref(next), browserAccountOrigin(undefined, host));
    signIn.searchParams.set('notice', 'cognito-not-configured');
    return redirect(signIn);
  }
  const bounce = googleStartRedirect(config.redirectUri, host, here.search);
  if (bounce) {
    return redirect(bounce);
  }
  const url = await beginHostedSignIn({ provider: 'google', next, retry: false });
  if (!url) {
    const signIn = new URL(signInHref(next), browserAccountOrigin(config.redirectUri, host));
    signIn.searchParams.set('notice', 'cognito-not-configured');
    return redirect(signIn);
  }
  return redirect(url);
}
