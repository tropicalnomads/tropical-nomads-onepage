'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';

const controlClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-ozora-navy/80 text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

export function ShopPhoto({
  src,
  alt,
  frameClassName,
  imageClassName = 'max-h-full w-full object-contain',
}: {
  src: string;
  alt: string;
  frameClassName: string;
  imageClassName?: string;
}) {
  const { language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <div className={`relative ${frameClassName}`}>
        <img src={src} alt={alt} className={imageClassName} />
        <button type="button" onClick={() => setOpen(true)} aria-label={shopText(language, 'enlarge')} className={`absolute right-2 top-2 ${controlClass}`}>
          <Maximize2 size={16} aria-hidden="true" />
        </button>
      </div>
      <dialog
        ref={dialogRef}
        aria-label={alt}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
        className="m-auto h-[min(92vh,100%)] w-[min(92vw,64rem)] rounded-3xl border border-white/15 bg-ozora-navy p-4 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpen(false)} aria-label={shopText(language, 'shrink')} className={controlClass}>
              <Minimize2 size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-ozora-cream/[0.04] p-4">
            <img src={src} alt="" className="max-h-[85vh] max-w-[92vw] object-contain" />
          </div>
        </div>
      </dialog>
    </>
  );
}
