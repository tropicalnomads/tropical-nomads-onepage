'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';

const MenuClose = createContext<() => void>(() => {});

const itemClass =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ozora-cream/90 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:opacity-60';

export function Menu({
  label,
  trigger,
  children,
  onOpen,
}: {
  label: string;
  trigger: (state: { open: boolean; toggle: () => void; menuId: string }) => ReactNode;
  children: ReactNode;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(): void {
    setOpen((current) => {
      const next = !current;
      if (next) {
        onOpen?.();
      }
      return next;
    });
  }

  function close(): void {
    setOpen(false);
  }

  return (
    <MenuClose.Provider value={close}>
      <div ref={rootRef} className="relative">
        {trigger({ open, toggle, menuId })}
        {open ? (
          <div
            id={menuId}
            role="menu"
            aria-label={label}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-2xl border border-white/10 bg-ozora-navy/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md"
          >
            {children}
          </div>
        ) : null}
      </div>
    </MenuClose.Provider>
  );
}

export function MenuItem({
  href,
  icon,
  children,
  onSelect,
  disabled,
}: {
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  const close = useContext(MenuClose);
  const content = (
    <>
      {icon}
      {children}
    </>
  );
  if (href !== undefined) {
    return (
      <a
        role="menuitem"
        href={href}
        className={itemClass}
        onClick={() => {
          onSelect?.();
          close();
        }}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      className={itemClass}
      disabled={disabled}
      onClick={() => {
        if (disabled) {
          return;
        }
        onSelect?.();
        close();
      }}
    >
      {content}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 border-t border-white/10" />;
}
