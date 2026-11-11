export type ArtistRequestType = 'booking' | 'press-kit';

const bookingsMailbox = 'bookings@tropical-nomads.com';

function mailboxName(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function requestSubject(type: ArtistRequestType, name: string): string {
  switch (type) {
    case 'booking':
      return `Booking request: ${name}`;
    case 'press-kit':
      return `Press kit request: ${name}`;
    default: {
      const unexpected: never = type;
      return unexpected;
    }
  }
}

function requestBody(type: ArtistRequestType, name: string): string {
  switch (type) {
    case 'booking':
      return `Hello,\n\nI would like to book ${name}.\n`;
    case 'press-kit':
      return `Hello,\n\nPlease send the press kit for ${name}.\n`;
    default: {
      const unexpected: never = type;
      return unexpected;
    }
  }
}

export function artistRequestMailto(artistName: string, type: ArtistRequestType): string | undefined {
  const name = mailboxName(artistName);
  if (name === '') {
    return undefined;
  }
  const subject = encodeURIComponent(requestSubject(type, name));
  const body = encodeURIComponent(requestBody(type, name));
  return `mailto:${bookingsMailbox}?subject=${subject}&body=${body}`;
}
