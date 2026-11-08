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
  'overflow-hidden rounded-full shadow-lg shadow-black/50 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-ozora-pink/20';

export function PartnerAvatar({
  partner,
  className = 'h-24 w-24',
  textClassName = 'text-2xl',
}: PartnerAvatarProps): JSX.Element {
  if (partner.logo) {
    const fitContain = partner.logoFit === 'contain';
    return (
      <span
        className={`${className} ${AVATAR_BASE} block ${
          fitContain
            ? 'border border-amber-300/40 bg-[radial-gradient(circle_at_50%_38%,#17382b_0%,#07120e_58%,#020605_100%)] ring-2 ring-emerald-300/10'
            : 'border-2 border-white/25 bg-ozora-ink ring-1 ring-inset ring-white/10'
        }`}
      >
        <img
          src={partner.logo}
          alt={`${partner.name} logo`}
          loading="lazy"
          className={fitContain ? 'h-full w-full object-contain p-2' : 'h-full w-full object-cover'}
        />
      </span>
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
