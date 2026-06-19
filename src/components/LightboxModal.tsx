import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { PastEventItem } from '@/lib/data';

interface LightboxModalProps {
  item: PastEventItem | null;
  onClose: () => void;
}

export function LightboxModal({ item, onClose }: LightboxModalProps): JSX.Element | null {
  useEffect(() => {
    if (!item) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} preview`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl border border-white/20 bg-ozora-navy p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close media preview"
          className="absolute right-3 top-3 rounded-md bg-black/40 p-2 text-ozora-cream transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <h3 className="pr-10 text-lg font-semibold text-ozora-cream">{item.title}</h3>
        <p className="mt-1 text-sm text-ozora-cream/70">{item.location}</p>
        <div className="mt-4 overflow-hidden rounded-xl">
          {item.type === 'video' ? (
            <video src={item.mediaUrl} controls autoPlay className="w-full" aria-label={`${item.title} video preview`} />
          ) : (
            <img src={item.mediaUrl} alt={`${item.title} highlight`} className="h-auto w-full object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}
