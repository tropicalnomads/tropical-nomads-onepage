export type EditionIndexItem = {
  id: string;
  slug: string;
  title: string;
  shortLabel: string;
  year?: number;
  galleryReady?: boolean;
};

export type EditionMeta = {
  id: string;
  slug: string;
  title: string;
  shortLabel: string;
  year?: number;
  city?: string;
  dateLabel?: string;
  description?: string;
  mainArt?: string;
  youtube?: { title: string; url: string }[];
  soundcloud?: { title: string; url: string }[];
};
