import { webHealth } from '../../src/health.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export async function GET(): Promise<Response> {
  const report = await webHealth();
  return Response.json(report, { headers });
}
