import * as flagIcons from 'country-flag-icons/react/3x2';
import type { ComponentType, SVGProps } from 'react';
import { countryCaption, isoCountryCode } from '../../artists/flag';

type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>;

const flags = flagIcons as unknown as Record<string, FlagComponent>;

export function CountryMark({
  flag,
  country,
  className,
  flagClassName,
}: {
  flag?: string;
  country?: string;
  className?: string;
  flagClassName?: string;
}) {
  const code = isoCountryCode(flag) ?? isoCountryCode(country);
  const caption = countryCaption(country, code);
  const Flag = code ? flags[code] : undefined;
  if (!Flag && !caption) {
    return null;
  }
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className ?? ''}`.trim()}>
      {Flag ? (
        <Flag
          aria-hidden={caption !== undefined}
          aria-label={caption ? undefined : code}
          className={flagClassName ?? 'h-3.5 w-5 shrink-0 rounded-[2px]'}
        />
      ) : null}
      {caption ? <span className="truncate">{caption}</span> : null}
    </span>
  );
}
