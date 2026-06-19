import type { Partner } from '@/lib/data';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

interface PartnerAvatarProps {
  partner: Partner;
  className?: string;
  textClassName?: string;
}

const AVATAR_BASE =
  'rounded-full border-2 border-white/25 shadow-lg shadow-black/50 ring-1 ring-inset ring-white/10 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:border-ozora-pink/70 group-hover:shadow-xl group-hover:shadow-ozora-pink/30';

export function PartnerAvatar({
  partner,
  className = 'h-24 w-24',
  textClassName = 'text-2xl',
}: PartnerAvatarProps): JSX.Element {
  if (partner.logo) {
    return (
      <img
        src={partner.logo}
        alt={`${partner.name} logo`}
        loading="lazy"
        className={`${className} ${AVATAR_BASE} bg-ozora-ink object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} ${textClassName} ${AVATAR_BASE} flex items-center justify-center bg-gradient-to-br from-ozora-turquoise/50 to-ozora-pink/50 font-black text-ozora-cream`}
    >
      {initials(partner.name)}
    </span>
  );
}
