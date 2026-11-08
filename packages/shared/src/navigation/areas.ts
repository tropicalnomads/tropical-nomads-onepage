export const webAreas = [
  { id: 'upcoming-events', label: 'Upcoming events', path: '/upcoming-events' },
  { id: 'my-tickets', label: 'My tickets', path: '/my-tickets' },
  { id: 'check-in', label: 'Check-in', path: '/check-in' },
  { id: 'merch', label: 'Merch', path: '/merch' },
] as const;

export type WebAreaId = (typeof webAreas)[number]['id'];
