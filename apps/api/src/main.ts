import { listen } from './http.ts';

const port = Number(process.env.API_PORT ?? 8787);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write('API_PORT must be a port number\n');
  process.exit(1);
}

const server = await listen(port);
server.on('close', () => {
  process.stdout.write('API stopped\n');
});
process.stdout.write(`API listening on 127.0.0.1:${port}\n`);
