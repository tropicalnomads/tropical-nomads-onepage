export const noindexRobotsTag = 'noindex, nofollow';

export function withNoindex(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('x-robots-tag', noindexRobotsTag);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
