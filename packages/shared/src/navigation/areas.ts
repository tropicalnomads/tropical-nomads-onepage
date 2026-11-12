export const webAreas = [
  { id: 'upcoming-events', label: 'Upcoming events', path: '/upcoming-events' },
  { id: 'my-tickets', label: 'My tickets', path: '/my-tickets' },
  { id: 'my-orders', label: 'My orders', path: '/my-orders' },
  { id: 'check-in', label: 'Check-in', path: '/check-in' },
  { id: 'shop', label: 'Shop', path: '/shop' },
] as const;

export type WebAreaId = (typeof webAreas)[number]['id'];
