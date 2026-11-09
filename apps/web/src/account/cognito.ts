import { createHash, createPublicKey, createVerify, type JsonWebKey } from 'node:crypto';
import type { VerifiedSignIn } from 'tropical-nomads-shared';
import type { AccountNotice } from '../i18n/copy';

export interface CognitoConfig {
  region: 'eu-central-1';
  userPoolId: string;
  clientId: string;
  hostedDomain: string;
  redirectUri: string;
  google: boolean;
  apple: boolean;
}

export type HostedProvider = 'cognito' | 'google' | 'apple';

export interface IdClaims {
  sub: string;
  email: string;
  emailVerified: true;
  givenName: string;
  familyName: string;
  preferredUsername: string;
  provider: 'cognito' | 'google' | 'apple';
  providerSubject: string;
}

export interface PendingNames {
  username: string;
  givenName: string;
  familyName: string;
}

type EnvMap = Record<string, string | undefined>;

type TokenKey = JsonWebKey & { kid?: string };

const poolIdPattern = /^eu-central-1_[A-Za-z0-9]+$/;

export function readCognitoConfig(env: EnvMap = process.env): CognitoConfig | undefined {
  const region = env.COGNITO_REGION?.trim() || 'eu-central-1';
  if (region !== 'eu-central-1') {
    return undefined;
  }
  const userPoolId = env.COGNITO_USER_POOL_ID?.trim() ?? '';
  const clientId = env.COGNITO_CLIENT_ID?.trim() ?? '';
  const hostedDomain = hostedHost(env.COGNITO_HOSTED_DOMAIN ?? '');
  const redirectUri = allowedRedirect(env.COGNITO_REDIRECT_URI ?? '');
  if (!poolIdPattern.test(userPoolId) || !/^[A-Za-z0-9]{1,128}$/.test(clientId) || !hostedDomain || !redirectUri) {
    return undefined;
  }
  return {
    region: 'eu-central-1',
    userPoolId,
    clientId,
    hostedDomain,
    redirectUri,
    google: env.COGNITO_GOOGLE === 'true',
    apple: env.COGNITO_APPLE === 'true',
  };
}

export function isCognitoAuthorizeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      /^[a-z0-9-]+\.auth\.eu-central-1\.amazoncognito\.com$/.test(url.hostname) &&
      url.pathname === '/oauth2/authorize'
    );
  } catch {
    return false;
  }
}

export function authorizeUrl(
  config: CognitoConfig,
  input: { provider: HostedProvider; state: string; nonce: string; verifier: string },
): string | undefined {
  if (!configAllows(config, input.provider)) {
    return undefined;
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(input.state) || !/^[A-Za-z0-9_-]{16,128}$/.test(input.nonce)) {
    return undefined;
  }
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(input.verifier)) {
    return undefined;
  }
  const challenge = createHash('sha256').update(input.verifier).digest('base64url');
  const url = new URL(`https://${config.hostedDomain}/oauth2/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', input.state);
  url.searchParams.set('nonce', input.nonce);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  const providerName = identityProvider(input.provider);
  if (providerName) {
    url.searchParams.set('identity_provider', providerName);
  }
  return url.toString();
}

export function verifyIdToken(
  token: string,
  config: CognitoConfig,
  jwks: { keys: readonly TokenKey[] },
  expectedNonce: string,
  now = Date.now(),
): IdClaims | undefined {
  if (token.length < 20 || token.length > 8000) {
    return undefined;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return undefined;
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  if (!headerPart || !payloadPart || !signaturePart) {
    return undefined;
  }
  let header: { alg?: unknown; kid?: unknown };
  let payload: Record<string, unknown>;
  try {
    header = readJson(headerPart) as { alg?: unknown; kid?: unknown };
    const parsed = readJson(payloadPart);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    return undefined;
  }
  const jwk = jwks.keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) {
    return undefined;
  }
  let verified = false;
  try {
    const key = createPublicKey({ key: jwk, format: 'jwk' });
    verified = createVerify('RSA-SHA256').update(`${headerPart}.${payloadPart}`).verify(key, Buffer.from(signaturePart, 'base64url'));
  } catch {
    return undefined;
  }
  if (!verified) {
    return undefined;
  }
  const issuer = `https://cognito-idp.eu-central-1.amazonaws.com/${config.userPoolId}`;
  if (payload.iss !== issuer || payload.aud !== config.clientId || payload.token_use !== 'id') {
    return undefined;
  }
  if (expectedNonce !== '' && payload.nonce !== expectedNonce) {
    return undefined;
  }
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now) {
    return undefined;
  }
  if (payload.email_verified !== true || typeof payload.email !== 'string' || typeof payload.sub !== 'string') {
    return undefined;
  }
  const email = payload.email.trim().toLowerCase();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub) || !email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    return undefined;
  }
  const federated = federatedIdentity(payload.identities);
  if (payload.identities !== undefined && !federated) {
    return undefined;
  }
  return {
    sub: payload.sub,
    email,
    emailVerified: true,
    givenName: typeof payload.given_name === 'string' ? payload.given_name.trim() : '',
    familyName: typeof payload.family_name === 'string' ? payload.family_name.trim() : '',
    preferredUsername: typeof payload.preferred_username === 'string' ? payload.preferred_username.trim() : '',
    provider: federated?.provider ?? 'cognito',
    providerSubject: federated?.subject ?? payload.sub,
  };
}

export function pendingNames(input: { username?: string; givenName?: string; familyName?: string }): PendingNames | undefined {
  const username = input.username?.trim() ?? '';
  const givenName = input.givenName?.trim() ?? '';
  const familyName = input.familyName?.trim() ?? '';
  if (username.length > 24 || givenName.length > 80 || familyName.length > 80) {
    return undefined;
  }
  if (username === '' && givenName === '' && familyName === '') {
    return undefined;
  }
  return { username, givenName, familyName };
}

export function verifiedSignInFromClaims(
  claims: IdClaims,
  pending: PendingNames | undefined,
  existing: PendingNames | undefined,
): VerifiedSignIn | undefined {
  const username = (existing?.username || pending?.username || claims.preferredUsername || '').trim();
  const givenName = (existing?.givenName || claims.givenName || pending?.givenName || '').trim();
  const familyName = (existing?.familyName || claims.familyName || pending?.familyName || '').trim();
  if (username === '' || givenName === '' || familyName === '') {
    return undefined;
  }
  return {
    sub: claims.sub,
    provider: claims.provider,
    providerSubject: claims.providerSubject,
    email: claims.email,
    emailVerified: true,
    username,
    givenName,
    familyName,
  };
}

export async function exchangeAuthCode(
  config: CognitoConfig,
  code: string,
  verifier: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | undefined> {
  if (!/^[A-Za-z0-9_-]{1,2048}$/.test(code) || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) {
    return undefined;
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier,
  });
  const response = await fetchImpl(`https://${config.hostedDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    return undefined;
  }
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }
  const idToken = (payload as { id_token?: unknown }).id_token;
  return typeof idToken === 'string' ? idToken : undefined;
}

export async function fetchJwks(config: CognitoConfig, fetchImpl: typeof fetch = fetch): Promise<{ keys: TokenKey[] } | undefined> {
  const response = await fetchImpl(`https://cognito-idp.eu-central-1.amazonaws.com/${config.userPoolId}/.well-known/jwks.json`);
  if (!response.ok) {
    return undefined;
  }
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !Array.isArray((payload as { keys?: unknown }).keys)) {
    return undefined;
  }
  return { keys: (payload as { keys: TokenKey[] }).keys };
}

function configAllows(config: CognitoConfig, provider: HostedProvider): boolean {
  switch (provider) {
    case 'cognito':
      return true;
    case 'google':
      return config.google;
    case 'apple':
      return config.apple;
    default: {
      const unexpected: never = provider;
      return unexpected;
    }
  }
}

function identityProvider(provider: HostedProvider): string | undefined {
  switch (provider) {
    case 'cognito':
      return undefined;
    case 'google':
      return 'Google';
    case 'apple':
      return 'SignInWithApple';
    default: {
      const unexpected: never = provider;
      return unexpected;
    }
  }
}

function hostedHost(value: string): string | undefined {
  const host = value.trim().toLowerCase();
  if (host === '' || host.includes('://') || host.includes('/') || host.includes('..')) {
    return undefined;
  }
  if (/^[a-z0-9-]{1,63}$/.test(host)) {
    return `${host}.auth.eu-central-1.amazoncognito.com`;
  }
  if (/^[a-z0-9-]+\.auth\.eu-central-1\.amazoncognito\.com$/.test(host)) {
    return host;
  }
  return undefined;
}

function allowedRedirect(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
      return undefined;
    }
    if (url.protocol === 'https:' && url.pathname === '/account/callback') {
      return `${url.origin}${url.pathname}`;
    }
    if (url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.pathname === '/account/callback') {
      return `${url.origin}${url.pathname}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function readJson(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

function federatedIdentity(value: unknown): { provider: 'google' | 'apple'; subject: string } | undefined {
  const parsed = typeof value === 'string' ? safeJson(value) : value;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return undefined;
  }
  const first = parsed[0];
  if (typeof first !== 'object' || first === null) {
    return undefined;
  }
  const record = first as { providerName?: unknown; userId?: unknown };
  if (typeof record.userId !== 'string' || !/^[A-Za-z0-9:._-]{1,200}$/.test(record.userId)) {
    return undefined;
  }
  switch (record.providerName) {
    case 'Google':
      return { provider: 'google', subject: record.userId };
    case 'SignInWithApple':
      return { provider: 'apple', subject: record.userId };
    default:
      return undefined;
  }
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export interface CognitoTarget {
  region: 'eu-central-1';
  userPoolId: string;
  clientId: string;
}

type FetchLike = (input: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export function cognitoTarget(env: Record<string, string | undefined> = process.env): CognitoTarget | undefined {
  const userPoolId = env.COGNITO_USER_POOL_ID?.trim() ?? '';
  const clientId = env.COGNITO_CLIENT_ID?.trim() ?? '';
  if (!/^eu-central-1_[A-Za-z0-9]+$/.test(userPoolId) || !/^[A-Za-z0-9]{20,128}$/.test(clientId)) {
    return undefined;
  }
  return { region: 'eu-central-1', userPoolId, clientId };
}

function problemCode(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    return '';
  }
  const record = body as { __type?: unknown; code?: unknown };
  const raw = typeof record.__type === 'string' ? record.__type : typeof record.code === 'string' ? record.code : '';
  const hash = raw.lastIndexOf('#');
  return hash === -1 ? raw : raw.slice(hash + 1);
}

function noticeFor(code: string): AccountNotice {
  switch (code) {
    case 'UsernameExistsException':
      return 'username-taken';
    case 'InvalidPasswordException':
    case 'InvalidParameterException':
      return 'password-short';
    case 'UserNotConfirmedException':
      return 'email-unconfirmed';
    case 'CodeMismatchException':
    case 'ExpiredCodeException':
      return 'code-invalid';
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'password-rejected';
    default:
      return 'password-rejected';
  }
}

async function postCognito(
  target: CognitoTarget,
  action: string,
  payload: Record<string, unknown>,
  fetchImpl: FetchLike,
): Promise<{ ok: true; body: unknown } | { ok: false; notice: AccountNotice; code: string }> {
  const response = await fetchImpl(`https://cognito-idp.${target.region}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const code = problemCode(body);
    return { ok: false, notice: noticeFor(code), code };
  }
  return { ok: true, body };
}

export async function registerWithCognito(
  input: { email: string; password: string },
  target: CognitoTarget,
  fetchImpl: FetchLike = fetch,
): Promise<{ sub?: string; notice?: AccountNotice }> {
  const result = await postCognito(
    target,
    'SignUp',
    {
      ClientId: target.clientId,
      Username: input.email,
      Password: input.password,
      UserAttributes: [{ Name: 'email', Value: input.email }],
    },
    fetchImpl,
  );
  if (!result.ok) {
    return { notice: result.notice };
  }
  const body = result.body as { UserConfirmed?: unknown; UserSub?: unknown };
  if (body.UserConfirmed !== true) {
    return { notice: 'email-unconfirmed' };
  }
  return typeof body.UserSub === 'string' ? { sub: body.UserSub } : { notice: 'email-unconfirmed' };
}

export async function signInWithCognito(
  email: string,
  password: string,
  target: CognitoTarget,
  fetchImpl: FetchLike = fetch,
): Promise<{ sub?: string; claims?: IdClaims; notice?: AccountNotice }> {
  const result = await postCognito(
    target,
    'InitiateAuth',
    {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: target.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    },
    fetchImpl,
  );
  if (!result.ok) {
    return { notice: result.notice };
  }
  const token = (result.body as { AuthenticationResult?: { IdToken?: unknown } }).AuthenticationResult?.IdToken;
  if (typeof token !== 'string') {
    return { notice: 'password-rejected' };
  }
  const jwks = await fetchJwks(
    {
      region: 'eu-central-1',
      userPoolId: target.userPoolId,
      clientId: target.clientId,
      hostedDomain: 'unused.auth.eu-central-1.amazoncognito.com',
      redirectUri: 'http://127.0.0.1/account/callback',
      google: false,
      apple: false,
    },
    fetchImpl as typeof fetch,
  );
  const claims = jwks ? verifyIdToken(token, { ...target, region: 'eu-central-1', hostedDomain: 'unused.auth.eu-central-1.amazoncognito.com', redirectUri: 'http://127.0.0.1/account/callback', google: false, apple: false }, jwks, '') : undefined;
  if (!claims) {
    return { notice: 'password-rejected' };
  }
  return { sub: claims.sub, claims };
}

export async function confirmSignUpWithCognito(
  email: string,
  code: string,
  target: CognitoTarget,
  fetchImpl: FetchLike = fetch,
): Promise<{ notice?: AccountNotice }> {
  const result = await postCognito(
    target,
    'ConfirmSignUp',
    {
      ClientId: target.clientId,
      Username: email,
      ConfirmationCode: code.trim(),
    },
    fetchImpl,
  );
  if (!result.ok) {
    if (
      result.code === 'CodeMismatchException' ||
      result.code === 'ExpiredCodeException' ||
      result.code === 'NotAuthorizedException' ||
      result.code === 'InvalidParameterException' ||
      result.code === 'UserNotFoundException'
    ) {
      return { notice: 'code-invalid' };
    }
    if (
      result.code === 'LimitExceededException' ||
      result.code === 'TooManyRequestsException' ||
      result.code === 'TooManyFailedAttemptsException'
    ) {
      return { notice: 'code-limited' };
    }
    return { notice: result.notice };
  }
  return {};
}

export async function resendConfirmationWithCognito(
  email: string,
  target: CognitoTarget,
  fetchImpl: FetchLike = fetch,
): Promise<{ notice: AccountNotice }> {
  const result = await postCognito(
    target,
    'ResendConfirmationCode',
    {
      ClientId: target.clientId,
      Username: email,
    },
    fetchImpl,
  );
  if (!result.ok) {
    if (result.code === 'UserNotFoundException') {
      return { notice: 'code-sent' };
    }
    if (
      result.code === 'LimitExceededException' ||
      result.code === 'TooManyRequestsException' ||
      result.code === 'TooManyFailedAttemptsException'
    ) {
      return { notice: 'code-limited' };
    }
    return { notice: result.notice };
  }
  return { notice: 'code-sent' };
}

export async function forgotPasswordWithCognito(
  email: string,
  target: CognitoTarget,
  fetchImpl: FetchLike = fetch,
): Promise<{ notice: AccountNotice }> {
  const result = await postCognito(
    target,
    'ForgotPassword',
    {
      ClientId: target.clientId,
      Username: email,
    },
    fetchImpl,
  );
  if (!result.ok && result.code !== 'UserNotFoundException') {
    return { notice: result.notice };
  }
  return { notice: 'reset-sent' };
}

export async function confirmForgotPasswordWithCognito(
  email: string,
  code: string,
  password: string,
  target: CognitoTarget,
  fetchImpl: FetchLike = fetch,
): Promise<{ notice?: AccountNotice }> {
  const result = await postCognito(
    target,
    'ConfirmForgotPassword',
    {
      ClientId: target.clientId,
      Username: email,
      ConfirmationCode: code.trim(),
      Password: password,
    },
    fetchImpl,
  );
  return result.ok ? {} : { notice: result.notice };
}
