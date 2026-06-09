export type PostSource = 'Instagram' | 'Manual';

export type Post = {
  slug: string;
  title: string;
  publishedAt: string;
  images?: string[];
  body?: string;
  source?: PostSource;
  igPostUrl?: string;
};

