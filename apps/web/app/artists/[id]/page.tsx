import { notFound } from 'next/navigation';
import { loadArtistPage } from '../../../src/artists/load';
import { ArtistProfileView } from '../../../src/components/ArtistProfileView';

export const dynamic = 'force-dynamic';

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await loadArtistPage(id);
  if (!page) {
    notFound();
  }
  return <ArtistProfileView artist={page.artist} upcoming={page.upcoming} past={page.past} />;
}
