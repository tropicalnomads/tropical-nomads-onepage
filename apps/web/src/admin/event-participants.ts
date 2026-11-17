export type ParticipantStatus = 'checked' | 'open' | 'unpaid';
export type ParticipantStatusFilter = 'all' | ParticipantStatus;

export interface ParticipantRow {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  status: ParticipantStatus;
  note: string;
  kind: 'ticket' | 'guest';
}

export interface ParticipantTicket {
  ticketId: string;
  name: string;
  offerName: string;
  state: ParticipantStatus;
}

export interface ParticipantGuest {
  guestId: string;
  name: string;
  email?: string;
  listName: string;
  observation?: string;
  state: 'checked' | 'open';
}

export interface ParticipantOwner {
  ticketId: string;
  name: string;
  email: string;
}

export interface ParticipantCounts {
  people: number;
  checkedIn: number;
  waiting: number;
}

function byName(left: ParticipantRow, right: ParticipantRow): number {
  const leftName = left.name.trim().toLowerCase();
  const rightName = right.name.trim().toLowerCase();
  if (leftName === '' && rightName !== '') {
    return 1;
  }
  if (rightName === '' && leftName !== '') {
    return -1;
  }
  const compared = leftName.localeCompare(rightName);
  if (compared !== 0) {
    return compared;
  }
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

export function participantRows(
  sold: readonly ParticipantTicket[],
  guests: readonly ParticipantGuest[],
  owners: readonly ParticipantOwner[],
): ParticipantRow[] {
  const ownerByTicket = new Map(owners.map((owner) => [owner.ticketId, owner]));
  const tickets: ParticipantRow[] = sold.map((row) => {
    const owner = ownerByTicket.get(row.ticketId);
    const ownerName = owner?.name.trim() ?? '';
    return {
      id: row.ticketId,
      name: ownerName !== '' ? ownerName : row.name,
      email: owner?.email.trim() ?? '',
      ticketType: row.offerName,
      status: row.state,
      note: '',
      kind: 'ticket',
    };
  });
  const listed: ParticipantRow[] = guests.map((guest) => ({
    id: guest.guestId,
    name: guest.name,
    email: guest.email?.trim() ?? '',
    ticketType: guest.listName,
    status: guest.state,
    note: guest.observation?.trim() ?? '',
    kind: 'guest',
  }));
  return [...tickets, ...listed].sort(byName);
}

export function participantTicketTypes(rows: readonly ParticipantRow[]): string[] {
  const types = new Set<string>();
  for (const row of rows) {
    if (row.ticketType.trim() !== '') {
      types.add(row.ticketType);
    }
  }
  return [...types].sort((left, right) => left.localeCompare(right));
}

export function participantCounts(rows: readonly ParticipantRow[]): ParticipantCounts {
  let checkedIn = 0;
  for (const row of rows) {
    if (row.status === 'checked') {
      checkedIn += 1;
    }
  }
  return { people: rows.length, checkedIn, waiting: rows.length - checkedIn };
}

export function filterParticipants(
  rows: readonly ParticipantRow[],
  query: string,
  ticketType: string,
  status: ParticipantStatusFilter,
): ParticipantRow[] {
  const needle = query.trim().toLowerCase();
  const type = ticketType.trim();
  return rows.filter((row) => {
    if (type !== '' && row.ticketType !== type) {
      return false;
    }
    if (status !== 'all' && row.status !== status) {
      return false;
    }
    if (needle === '') {
      return true;
    }
    return [row.name, row.email, row.ticketType, row.note].some((value) => value.toLowerCase().includes(needle));
  });
}
