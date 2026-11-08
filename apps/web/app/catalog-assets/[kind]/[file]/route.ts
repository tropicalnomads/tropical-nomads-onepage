import { readFile } from 'node:fs/promises';
import { catalogAsset } from '../../../../src/events/assets.ts';

export async function GET(_request: Request, context: { params: Promise<{ kind: string; file: string }> }): Promise<Response> {
  const { kind, file } = await context.params;
  const asset = catalogAsset(kind, file);
  if (!asset) {
    return new Response(null, {
      status: 404,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  }
  const bytes = await readFile(asset.path);
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': asset.contentType,
      'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
      'cache-control': 'public, max-age=3600',
      'x-frame-options': 'DENY',
    },
  });
}
