const slugLimit = 60;

export interface SlugEvent {
  id: string;
  title: string;
  slug?: string;
}

/** A readable URL piece from a title: lowercase, hyphenated, and free of accents. */
export function eventSlug(title: string): string {
  const plain = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const slug = plain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, slugLimit)
    .replace(/-+$/g, '');
  return slug === '' ? 'event' : slug;
}

function isStoredSlug(value: string): boolean {
  return value.length > 0 && value.length <= slugLimit && value === eventSlug(value);
}

function withSuffix(base: string, count: number): string {
  const suffix = `-${count}`;
  const stem = base.slice(0, slugLimit - suffix.length).replace(/-+$/g, '');
  return `${stem === '' ? 'event' : stem}${suffix}`;
}

/**
 * One stable public slug per event.
 * A saved slug is kept. Events without one take the title, then `-2`, `-3`, and so on.
 * A slug is never another event's id.
 */
export function assignEventSlugs(events: readonly SlugEvent[]): Map<string, string> {
  const ordered = [...events].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
  const ids = new Set(ordered.map((event) => event.id));
  const used = new Set<string>();
  const assigned = new Map<string, string>();
  const blocksAnotherEvent = (slug: string, eventId: string): boolean => ids.has(slug) && slug !== eventId;
  for (const event of ordered) {
    const stored = event.slug?.trim() ?? '';
    if (isStoredSlug(stored) && !used.has(stored) && !blocksAnotherEvent(stored, event.id)) {
      assigned.set(event.id, stored);
      used.add(stored);
    }
  }
  for (const event of ordered) {
    if (assigned.has(event.id)) {
      continue;
    }
    const base = eventSlug(event.title);
    let slug = base;
    let count = 2;
    while (used.has(slug) || blocksAnotherEvent(slug, event.id)) {
      slug = withSuffix(base, count);
      count += 1;
    }
    assigned.set(event.id, slug);
    used.add(slug);
  }
  const values = [...assigned.values()];
  if (new Set(values).size !== values.length) {
    throw new Error('event slug is not unique');
  }
  return assigned;
}

/** A slug for this event that no other event already uses, including slugs taken from their titles. */
export function eventSlugFor(title: string, id: string, others: readonly SlugEvent[]): string {
  const rest = others.filter((event) => event.id !== id);
  const reserved = new Set(assignEventSlugs(rest).values());
  const ids = new Set(rest.map((event) => event.id));
  ids.add(id);
  const base = eventSlug(title);
  let slug = base;
  let count = 2;
  while (reserved.has(slug) || (ids.has(slug) && slug !== id)) {
    slug = withSuffix(base, count);
    count += 1;
  }
  return slug;
}
