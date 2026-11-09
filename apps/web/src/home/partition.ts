import type { HomeEvent } from './types.ts';

export function partitionEvents(events: readonly HomeEvent[], now = new Date()): { upcoming: HomeEvent[]; past: HomeEvent[] } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const upcoming: HomeEvent[] = [];
  const past: HomeEvent[] = [];
  for (const event of events) {
    if (new Date(event.dateStart).getTime() >= today) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  }
  upcoming.sort((left, right) => new Date(left.dateStart).getTime() - new Date(right.dateStart).getTime());
  past.sort((left, right) => new Date(right.dateStart).getTime() - new Date(left.dateStart).getTime());
  return { upcoming, past };
}
