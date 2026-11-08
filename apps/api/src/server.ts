import { serve, type ServerType } from '@hono/node-server';
import { api } from './app.ts';

export function listen(port: number): Promise<ServerType> {
  return new Promise((resolve, reject) => {
    const server = serve(
      {
        fetch: api.fetch,
        hostname: '127.0.0.1',
        port,
      },
      () => {
        resolve(server);
      },
    );
    server.on('error', reject);
  });
}
