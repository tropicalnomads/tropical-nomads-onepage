import { sessionSecretConfigured } from './account/session.ts';
import { apiOrigin } from './api-origin.ts';

export type ApiCheck = 'not-configured' | 'ok' | 'unreachable';

export interface WebHealth {
  status: 'ok' | 'degraded';
  service: 'tropical-nomads-web';
  uptimeSeconds: number;
  api: ApiCheck;
  sessionConfigured: boolean;
}

const processStartedAt = Date.now();

type Probe = (url: string) => Promise<{ ok: boolean }>;

async function probeApi(url: string): Promise<{ ok: boolean }> {
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(2000),
  });
  return { ok: response.ok };
}

function sessionIsConfigured(env: Record<string, string | undefined>): boolean {
  return sessionSecretConfigured(env);
}

function statusFor(api: ApiCheck): WebHealth['status'] {
  switch (api) {
    case 'not-configured':
    case 'ok':
      return 'ok';
    case 'unreachable':
      return 'degraded';
    default: {
      const unexpected: never = api;
      return unexpected;
    }
  }
}

async function readApi(env: Record<string, string | undefined>, probe: Probe): Promise<ApiCheck> {
  const origin = apiOrigin(env);
  if (origin === undefined) {
    return 'not-configured';
  }
  try {
    const response = await probe(`${origin}/health`);
    return response.ok ? 'ok' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

/** The web process is answering. `api` says whether the configured API health route answered. */
export async function webHealth(
  env: Record<string, string | undefined> = process.env,
  probe: Probe = probeApi,
  now = Date.now(),
  startedAt = processStartedAt,
): Promise<WebHealth> {
  const api = await readApi(env, probe);
  const elapsed = Math.max(0, now - startedAt);
  return {
    status: statusFor(api),
    service: 'tropical-nomads-web',
    uptimeSeconds: Math.floor(elapsed / 1000),
    api,
    sessionConfigured: sessionIsConfigured(env),
  };
}
