'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectFieldProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: readonly SelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  density?: 'default' | 'compact';
}

interface MenuBox {
  left: number;
  width: number;
  maxHeight: number;
  opensUp: boolean;
  top: number;
  bottom: number;
}

function firstEnabled(options: readonly SelectOption[], fromEnd = false): number {
  const start = fromEnd ? options.length - 1 : 0;
  const step = fromEnd ? -1 : 1;
  for (let index = start; index >= 0 && index < options.length; index += step) {
    if (options[index]?.disabled !== true) {
      return index;
    }
  }
  return -1;
}

function stepEnabled(options: readonly SelectOption[], start: number, direction: 1 | -1): number {
  if (options.length === 0) {
    return -1;
  }
  for (let step = 1; step <= options.length; step += 1) {
    const raw = (start + direction * step) % options.length;
    const index = raw < 0 ? raw + options.length : raw;
    if (options[index]?.disabled !== true) {
      return index;
    }
  }
  return start;
}

function filterOptions(options: readonly SelectOption[], query: string): readonly SelectOption[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return options;
  }
  return options.filter((option) => option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle));
}

function matchOption(options: readonly SelectOption[], query: string, start: number): number {
  for (let step = 1; step <= options.length; step += 1) {
    const raw = (start + step) % options.length;
    const index = raw < 0 ? raw + options.length : raw;
    const option = options[index];
    if (option && option.disabled !== true && option.label.toLowerCase().startsWith(query)) {
      return index;
    }
  }
  return -1;
}

function optionClass(selected: boolean, active: boolean, disabled: boolean): string {
  if (disabled) {
    return 'cursor-not-allowed text-ozora-cream/30';
  }
  if (selected) {
    return 'bg-ozora-yellow font-semibold text-ozora-ink';
  }
  if (active) {
    return 'bg-ozora-turquoise/20 font-medium text-ozora-cream';
  }
  return 'font-medium text-ozora-cream/90 hover:bg-ozora-turquoise/15 hover:text-ozora-cream';
}

export function SelectField({
  name,
  value,
  defaultValue,
  options,
  onChange,
  placeholder,
  disabled = false,
  id,
  className,
  ariaLabel,
  searchable = false,
  searchPlaceholder,
  emptyLabel,
  density = 'default',
}: SelectFieldProps) {
  const uid = useId();
  const buttonId = id ?? `${uid}-button`;
  const listId = `${uid}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef('');
  const queryTimer = useRef<number | undefined>(undefined);
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuBox, setMenuBox] = useState<MenuBox | null>(null);
  const [filter, setFilter] = useState('');
  const current = value ?? uncontrolled;
  const selectedIndex = options.findIndex((option) => option.value === current);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const visibleOptions = filterOptions(options, searchable ? filter : '');
  const isDisabled = disabled || options.length === 0;
  const shown = selectedOption?.label ?? placeholder ?? '';
  const accessibleName = ariaLabel && shown ? `${ariaLabel}, ${shown}` : ariaLabel || shown || undefined;

  useEffect(() => {
    return () => window.clearTimeout(queryTimer.current);
  }, []);

  useEffect(() => {
    if (open) {
      return;
    }
    setFilter('');
    setMenuBox(null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const measure = (): void => {
      const rect = root.getBoundingClientRect();
      const gap = 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const opensUp = spaceBelow < 240 && spaceAbove > spaceBelow;
      const available = opensUp ? spaceAbove : spaceBelow;
      setMenuBox({
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(320, Math.max(available, 96)),
        opensUp,
        top: rect.bottom + gap,
        bottom: window.innerHeight - rect.top + gap,
      });
    };

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (root.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const onEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const onScroll = (event: Event): void => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }
      measure();
    };

    measure();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const menuReady = menuBox !== null;

  useEffect(() => {
    if (!open || !menuReady || activeIndex < 0) {
      return;
    }
    const menu = optionsRef.current;
    const optionNode = document.getElementById(`${uid}-option-${activeIndex}`);
    if (!menu || !optionNode) {
      return;
    }
    const optionTop = optionNode.offsetTop;
    const optionBottom = optionTop + optionNode.offsetHeight;
    if (optionTop < menu.scrollTop) {
      menu.scrollTop = optionTop;
    } else if (optionBottom > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = optionBottom - menu.clientHeight;
    }
  }, [activeIndex, menuReady, open, uid]);

  useEffect(() => {
    if (!open || !searchable || !menuReady) {
      return;
    }
    searchRef.current?.focus();
  }, [menuReady, open, searchable]);

  const choose = (index: number): void => {
    const option = visibleOptions[index];
    if (!option || option.disabled) {
      return;
    }
    if (value === undefined) {
      setUncontrolled(option.value);
    }
    onChange?.(option.value);
    setOpen(false);
  };

  const openAt = (index: number): void => {
    setActiveIndex(index);
    setOpen(true);
  };

  const preferredIndex = (): number => {
    const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    if (selected && selected.disabled !== true) {
      const visibleIndex = visibleOptions.findIndex((option) => option.value === selected.value);
      if (visibleIndex >= 0) {
        return visibleIndex;
      }
    }
    return firstEnabled(visibleOptions);
  };

  const onTypeahead = (char: string): void => {
    window.clearTimeout(queryTimer.current);
    queryRef.current = `${queryRef.current}${char}`.toLowerCase();
    queryTimer.current = window.setTimeout(() => {
      queryRef.current = '';
    }, 450);
    const found = matchOption(visibleOptions, queryRef.current, open ? activeIndex : -1);
    if (found >= 0) {
      openAt(found);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (isDisabled) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!open) {
        const currentIndex = preferredIndex();
        openAt(currentIndex >= 0 ? currentIndex : firstEnabled(visibleOptions, direction === -1));
        return;
      }
      setActiveIndex((currentIndex) => stepEnabled(visibleOptions, currentIndex < 0 ? (direction === 1 ? -1 : 0) : currentIndex, direction));
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      openAt(firstEnabled(visibleOptions, event.key === 'End'));
      return;
    }
    if (event.key === 'Enter' || (event.key === ' ' && !(event.target instanceof HTMLInputElement))) {
      event.preventDefault();
      if (!open) {
        openAt(preferredIndex());
        return;
      }
      choose(activeIndex);
      return;
    }
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (!(event.target instanceof HTMLInputElement) && event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      onTypeahead(event.key);
    }
  };

  const menu =
    open && menuBox && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
              if (event.target instanceof HTMLInputElement) {
                return;
              }
              event.preventDefault();
            }}
            style={{
              position: 'fixed',
              left: menuBox.left,
              width: menuBox.width,
              maxHeight: menuBox.maxHeight,
              zIndex: 80,
              ...(menuBox.opensUp ? { bottom: menuBox.bottom } : { top: menuBox.top }),
            }}
            className="flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#053b38] shadow-[0_22px_60px_rgba(0,0,0,0.48)]"
          >
            {searchable ? (
              <div className="border-b border-white/10 p-1.5">
                <input
                  ref={searchRef}
                  value={filter}
                  autoComplete="off"
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  aria-controls={listId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setFilter(next);
                    setActiveIndex(firstEnabled(filterOptions(options, next)));
                  }}
                  onKeyDown={onKeyDown}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-ozora-cream outline-none placeholder:text-ozora-cream/40 focus:border-ozora-yellow"
                />
              </div>
            ) : null}
            <div
              ref={optionsRef}
              id={listId}
              role="listbox"
              aria-labelledby={buttonId}
              className="flex flex-col gap-0.5 overflow-auto overscroll-contain p-1.5 [scrollbar-color:rgba(255,248,231,0.28)_transparent] [scrollbar-width:thin]"
              style={{ maxHeight: menuBox.maxHeight - (searchable ? 58 : 0) }}
            >
            {visibleOptions.length === 0 ? <p className="px-3 py-2.5 text-sm text-ozora-cream/50">{emptyLabel}</p> : null}
            {visibleOptions.map((option, index) => {
              const selected = option.value === current;
              const active = index === activeIndex;
              return (
                <div
                  key={option.value}
                  id={`${uid}-option-${index}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => {
                    if (option.disabled !== true) {
                      setActiveIndex(index);
                    }
                  }}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${optionClass(selected, active, option.disabled === true)}`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.description ? (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        selected ? 'bg-ozora-ink/10 text-ozora-ink' : 'bg-ozora-turquoise/15 text-ozora-turquoise'
                      }`}
                    >
                      {option.description}
                    </span>
                  ) : null}
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {selected ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : null}
                  </span>
                </div>
              );
            })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative w-full ${className ?? ''}`.trim()}>
      <button
        id={buttonId}
        type="button"
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${uid}-option-${activeIndex}` : undefined}
        aria-label={accessibleName}
        onClick={() => {
          if (isDisabled) {
            return;
          }
          if (open) {
            setOpen(false);
            return;
          }
          openAt(preferredIndex());
        }}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between rounded-xl border bg-black/25 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-ozora-yellow/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          density === 'compact' ? 'h-10 gap-2 px-3' : 'h-12 gap-3 px-4'
        } ${
          open ? 'border-ozora-yellow/80 ring-2 ring-ozora-yellow/20' : 'border-white/15'
        }`}
      >
        <span className={`min-w-0 flex-1 truncate font-medium ${selectedOption ? 'text-ozora-cream' : 'text-ozora-cream/40'}`}>{shown}</span>
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full border transition ${
            density === 'compact' ? 'h-6 w-6' : 'h-7 w-7'
          } ${
            open ? 'border-ozora-yellow/40 bg-ozora-yellow text-ozora-ink' : 'border-white/10 bg-white/5 text-ozora-cream/75'
          }`}
        >
          <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      {menu}
    </div>
  );
}
