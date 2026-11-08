import type { AccountNotice } from '../i18n/copy';

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
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'password-rejected';
    default:
      return 'password-rejected';
  }
}

async function postCognito(target: CognitoTarget, action: string, payload: Record<string, unknown>, fetchImpl: FetchLike): Promise<{ ok: true; body: unknown } | { ok: false; notice: AccountNotice }> {
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
    return { ok: false, notice: noticeFor(problemCode(body)) };
  }
  return { ok: true, body };
}

function subFromIdToken(token: unknown): string | undefined {
  if (typeof token !== 'string') {
    return undefined;
  }
  const part = token.split('.')[1];
  if (!part) {
    return undefined;
  }
  try {
    const payload: unknown = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    if (typeof payload !== 'object' || payload === null) {
      return undefined;
    }
    const sub = (payload as { sub?: unknown }).sub;
    return typeof sub === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(sub) ? sub : undefined;
  } catch {
    return undefined;
  }
}

export async function registerWithCognito(
  input: { email: string; password: string; givenName: string; familyName: string },
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
      UserAttributes: [
        { Name: 'email', Value: input.email },
        { Name: 'given_name', Value: input.givenName },
        { Name: 'family_name', Value: input.familyName },
      ],
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
): Promise<{ sub?: string; notice?: AccountNotice }> {
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
  const body = result.body as { AuthenticationResult?: { IdToken?: unknown } };
  const sub = subFromIdToken(body.AuthenticationResult?.IdToken);
  return sub === undefined ? { notice: 'password-rejected' } : { sub };
}
