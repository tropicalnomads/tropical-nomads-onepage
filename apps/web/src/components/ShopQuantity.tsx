'use client';

import { Minus, Plus } from 'lucide-react';
import { IconButton } from './ui/Button';

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
      <IconButton label={decreaseLabel} disabled={quantity <= 1} onClick={() => onChange(quantity - 1)} className="h-11 w-11">
        <Minus size={16} aria-hidden="true" />
      </IconButton>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ozora-cream">{quantity}</span>
      <IconButton label={increaseLabel} disabled={quantity >= max} onClick={() => onChange(quantity + 1)} className="h-11 w-11">
        <Plus size={16} aria-hidden="true" />
      </IconButton>
    </div>
  );
}
