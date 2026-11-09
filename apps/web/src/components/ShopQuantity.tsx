'use client';

import { Minus, Plus } from 'lucide-react';

export function QuantityStepper({
  quantity,
  max,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  quantity: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/15 bg-black/25">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ozora-cream transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-ozora-cream/30"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ozora-cream">{quantity}</span>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ozora-cream transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-ozora-cream/30"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
