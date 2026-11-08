import { serve, type ServerType } from '@hono/node-server';
import { api } from './app.ts';

const loopback = '127.0.0.1';
const taskInterface = '0.0.0.0';

export function apiHostname(value: string | undefined = process.env.API_HOSTNAME): string {
  if (value === undefined || value === '' || value === loopback) {
    return loopback;
  }
  if (value === taskInterface) {
    return taskInterface;
  }
  throw new Error('API_HOSTNAME must be 127.0.0.1 or 0.0.0.0');
}

export function listen(port: number, hostname = apiHostname()): Promise<ServerType> {
  return new Promise((resolve, reject) => {
    const server = serve(
      {
        fetch: api.fetch,
        hostname,
        port,
      },
      () => {
        resolve(server);
      },
    );
    server.on('error', reject);
  });
}
