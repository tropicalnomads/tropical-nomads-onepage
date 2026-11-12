import * as flagIcons from 'country-flag-icons/react/3x2';
import type { ComponentType, SVGProps } from 'react';

type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>;

const flags = flagIcons as unknown as Record<string, FlagComponent>;

function isoCountryCode(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const chars = Array.from(value.trim());
  if (chars.length !== 2) {
    return undefined;
  }
  const letters = chars.map((char) => {
    const point = char.codePointAt(0);
    if (point === undefined) {
      return undefined;
    }
    if (point >= 65 && point <= 90) {
      return point;
    }
    if (point >= 97 && point <= 122) {
      return point - 32;
    }
    if (point < 0x1f1e6 || point > 0x1f1ff) {
      return undefined;
    }
    return point - 0x1f1e6 + 65;
  });
  const first = letters[0];
  const second = letters[1];
  if (first === undefined || second === undefined) {
    return undefined;
  }
  return String.fromCharCode(first, second);
}

export function CountryFlag({ flag, className }: { flag?: string; className?: string }) {
  const code = isoCountryCode(flag);
  const Flag = code ? flags[code] : undefined;
  if (!Flag) {
    return null;
  }
  return <Flag aria-label={code} className={className ?? 'inline-block h-3.5 w-5 shrink-0 rounded-[2px]'} />;
}
