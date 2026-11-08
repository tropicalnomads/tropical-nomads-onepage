import { webAreas, type WebAreaId } from 'tropical-nomads-shared';

export interface NavigationItem {
  id: WebAreaId;
  href: string;
}

export const navigation: readonly NavigationItem[] = webAreas.map((area) => ({
  id: area.id,
  href: area.path,
}));
