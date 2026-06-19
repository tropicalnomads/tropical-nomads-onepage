import { Image as ImageIcon, PlayCircle } from 'lucide-react';
import type { PastEventItem } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';

interface PastEventsGalleryProps {
  items: PastEventItem[];
  onOpenPreview: (item: PastEventItem) => void;
}

export function PastEventsGallery({ items, onOpenPreview }: PastEventsGalleryProps): JSX.Element {
  return (
    <section className="safe-x px-4 py-14 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">Past events highlights</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">A quick look back at memorable moments.</p>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No past highlights" description="Media placeholders will be added soon." />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const Icon = item.type === 'video' ? PlayCircle : ImageIcon;
              const mediaLabel = item.type === 'video' ? 'Video' : 'Photo';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenPreview(item)}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-ozora-turquoise/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                  aria-label={`Preview ${item.title}`}
                >
                  <img src={item.thumbnailUrl} alt={`${item.title} thumbnail`} className="h-44 w-full object-cover" />
                  <div className="space-y-1 p-4">
                    <p className="inline-flex items-center gap-1 rounded-full bg-ozora-turquoise/15 px-2 py-1 text-xs font-medium text-ozora-turquoise">
                      <Icon size={14} aria-hidden="true" />
                      {mediaLabel}
                    </p>
                    <h3 className="text-base font-semibold text-ozora-cream group-hover:text-ozora-yellow">{item.title}</h3>
                    <p className="text-sm text-ozora-cream/70">{item.location}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
