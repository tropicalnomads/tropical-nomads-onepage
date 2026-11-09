export interface ApiHealth {
  status: 'ok';
  service: 'tropical-nomads-api';
  uptimeSeconds: number;
}

const processStartedAt = Date.now();

/** The process is answering. This does not open the database or read a catalog. */
export function apiHealth(now = Date.now(), startedAt = processStartedAt): ApiHealth {
  const elapsed = Math.max(0, now - startedAt);
  return {
    status: 'ok',
    service: 'tropical-nomads-api',
    uptimeSeconds: Math.floor(elapsed / 1000),
  };
}
