import { robotsTxt } from '../../src/seo/robots.ts';

export function GET(): Response {
  return new Response(robotsTxt(), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
