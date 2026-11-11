'use client';

import { Bold, Italic } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { ShopMarkdown } from '../../shop/markdown';
import { IconButton } from '../ui/Button';

export function MarkdownField({
  id,
  name,
  value,
  maxLength,
  rows,
  label,
  boldLabel,
  italicLabel,
  help,
  previewLabel,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  maxLength: number;
  rows: number;
  label: string;
  boldLabel: string;
  italicLabel: string;
  help: string;
  previewLabel: string;
  onChange: (value: string) => void;
}) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  function formatDescription(marker: '*' | '**'): void {
    const textarea = descriptionRef.current;
    if (!textarea) {
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`.slice(0, maxLength);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="text-sm font-bold text-ozora-cream">
          {label}
        </label>
        <span className="text-xs tabular-nums text-ozora-cream/40">
          {value.length}/{maxLength}
        </span>
      </div>
      <div className="mt-2 overflow-hidden rounded-2xl border border-white/15 bg-black/25 focus-within:border-ozora-turquoise focus-within:ring-2 focus-within:ring-ozora-turquoise/15">
        <div className="flex items-center gap-1 border-b border-white/10 px-2 py-2">
          <IconButton label={boldLabel} title={boldLabel} onClick={() => formatDescription('**')}>
            <Bold size={17} aria-hidden="true" />
          </IconButton>
          <IconButton label={italicLabel} title={italicLabel} onClick={() => formatDescription('*')}>
            <Italic size={17} aria-hidden="true" />
          </IconButton>
          <span className="ml-2 text-xs text-ozora-cream/35">{help}</span>
        </div>
        <textarea
          ref={descriptionRef}
          id={id}
          name={name}
          maxLength={maxLength}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y bg-transparent px-4 py-3 text-base leading-relaxed text-ozora-cream outline-none placeholder:text-ozora-cream/30"
        />
      </div>
      {value.trim() ? <MarkdownPreview label={previewLabel}>{value}</MarkdownPreview> : null}
    </div>
  );
}

function MarkdownPreview({ label, children }: { label: string; children: string }): ReactNode {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 p-4">
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ozora-cream/35">{label}</p>
      <div className="text-sm leading-relaxed text-ozora-cream/70">
        <ShopMarkdown text={children} />
      </div>
    </div>
  );
}
