import { webAreas, type WebAreaId } from 'tropical-nomads-shared';

export interface NavigationItem {
  id: WebAreaId;
  href: string;
}

const omittedFromBar = new Set<WebAreaId>(['my-tickets', 'check-in']);

export const navigation: readonly NavigationItem[] = webAreas
  .filter((area) => !omittedFromBar.has(area.id))
  .map((area) => ({
    id: area.id,
    href: area.path,
  }));
