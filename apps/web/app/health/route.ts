import { webHealth } from '../../src/health.ts';
import { withNoindex } from '../../src/seo/headers.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export async function GET(): Promise<Response> {
  const report = await webHealth();
  return withNoindex(Response.json(report, { headers }));
}
