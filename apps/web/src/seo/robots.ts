import { siteOrigin } from './urls.ts';

export const robotAgents = [
  '*',
  'Googlebot',
  'Bingbot',
  'Twitterbot',
  'facebookexternalhit',
  'WhatsApp',
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
] as const;

export const robotDisallows = ['/account', '/my-tickets', '/check-in', '/health'] as const;

export function robotsTxt(): string {
  const groups = robotAgents.map((agent) =>
    [`User-agent: ${agent}`, 'Allow: /', ...robotDisallows.map((path) => `Disallow: ${path}`)].join('\n'),
  );
  return `${groups.join('\n\n')}\n\nSitemap: ${siteOrigin}/sitemap.xml\n`;
}
