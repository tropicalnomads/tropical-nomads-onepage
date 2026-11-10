export type FlyerAction = 'keep' | 'replace' | 'remove';

export function flyerAfter(current: string, action: FlyerAction, partyId: string): string {
  switch (action) {
    case 'keep':
      return current;
    case 'replace':
      return `/events/media/${partyId}`;
    case 'remove':
      return current.startsWith('/events/media/') ? '' : current;
    default: {
      const unexpected: never = action;
      return unexpected;
    }
  }
}

export function uploadedEventFlyer(full: string | undefined): string | undefined {
  if (full && /^\/events\/media\/[A-Za-z0-9_-]{1,80}$/.test(full)) {
    return full;
  }
  return undefined;
}
