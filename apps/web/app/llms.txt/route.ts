import { llmsTxt } from '../../src/seo/llms.ts';

export function GET(): Response {
  return new Response(llmsTxt(), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
