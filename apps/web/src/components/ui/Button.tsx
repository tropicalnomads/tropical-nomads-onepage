import { ArrowLeft } from 'lucide-react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'back';
export type ButtonSize = 'sm' | 'md';

type SharedProps = {
  tone?: ButtonTone;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

type ButtonAsLink = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string;
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const baseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-ozora-navy';

function toneClass(tone: ButtonTone): string {
  switch (tone) {
    case 'primary':
      return 'border border-ozora-ink/20 bg-ozora-yellow text-ozora-ink hover:border-ozora-ink/50 hover:brightness-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ozora-cream/40 disabled:hover:bg-white/10 disabled:hover:brightness-100';
    case 'secondary':
      return 'border border-ozora-ink/20 bg-ozora-coral text-ozora-ink hover:border-ozora-ink/50 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100';
    case 'ghost':
      return 'border border-white/15 text-ozora-cream hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';
    case 'back':
      return 'border border-white/15 text-ozora-cream hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';
    default: {
      const unexpected: never = tone;
      return unexpected;
    }
  }
}

function sizeClass(size: ButtonSize): string {
  switch (size) {
    case 'sm':
      return 'h-10 px-4 text-sm';
    case 'md':
      return 'h-12 px-5 text-sm';
    default: {
      const unexpected: never = size;
      return unexpected;
    }
  }
}

export function buttonClass(tone: ButtonTone = 'primary', size: ButtonSize = 'md', className?: string): string {
  return [baseClass, toneClass(tone), sizeClass(size), className].filter((part) => part !== undefined && part !== '').join(' ');
}

export function Button({ tone = 'primary', size = 'md', icon, className, children, ...props }: ButtonProps) {
  const classes = buttonClass(tone, size, className);
  const leading = tone === 'back' && icon === undefined ? <ArrowLeft size={16} aria-hidden="true" /> : icon;
  const content = (
    <>
      {leading}
      {children}
    </>
  );
  if (props.href !== undefined) {
    const { href, disabled, ...linkProps } = props;
    return (
      <a
        href={disabled ? undefined : href}
        aria-disabled={disabled || undefined}
        className={`${classes}${disabled ? ' pointer-events-none opacity-40' : ''}`}
        {...linkProps}
      >
        {content}
      </a>
    );
  }
  const { type = 'button', ...buttonProps } = props;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'aria-label'> & {
  label: string;
  children: ReactNode;
  className?: string;
};

export function IconButton({ label, children, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={['inline-flex h-9 w-9 items-center justify-center rounded-xl text-ozora-cream/70 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:cursor-not-allowed disabled:opacity-40', className]
        .filter((part) => part !== undefined && part !== '')
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

const textLinkClass =
  'font-semibold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:cursor-wait disabled:opacity-60';

type TextLinkProps = {
  className?: string;
  children: ReactNode;
} & (
  | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'>)
  | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
);

export function TextLink({ className, children, ...props }: TextLinkProps) {
  const classes = [textLinkClass, className].filter((part) => part !== undefined && part !== '').join(' ');
  if (props.href !== undefined) {
    const { href, ...linkProps } = props;
    return (
      <a href={href} className={classes} {...linkProps}>
        {children}
      </a>
    );
  }
  const { type = 'button', ...buttonProps } = props;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
