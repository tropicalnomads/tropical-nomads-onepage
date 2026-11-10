import { apiOrigin } from '../../../../src/api-origin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const imageHeaders = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function imageType(value: string): value is 'image/jpeg' | 'image/png' | 'image/webp' {
  switch (value) {
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
      return true;
    default:
      return false;
  }
}

export async function GET(_request: Request, context: { params: Promise<{ productId: string }> }): Promise<Response> {
  const { productId } = await context.params;
  const origin = apiOrigin();
  if (!origin || !/^[A-Za-z0-9_-]{1,40}$/.test(productId)) {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  const response = await fetch(`${origin}/product-image/${productId}`, { cache: 'no-store' });
  if (!response.ok) {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  const body: unknown = await response.json();
  if (!isRecord(body) || typeof body.contentType !== 'string' || typeof body.bytes !== 'string' || body.bytes.length > 7_000_000 || !imageType(body.contentType)) {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  return new Response(Buffer.from(body.bytes, 'base64'), {
    status: 200,
    headers: { ...imageHeaders, 'content-type': body.contentType },
  });
}
