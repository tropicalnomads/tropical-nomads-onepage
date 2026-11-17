import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  filterParticipants,
  participantCounts,
  participantRows,
  participantTicketTypes,
  type ParticipantGuest,
  type ParticipantOwner,
  type ParticipantRow,
  type ParticipantTicket,
} from '../src/admin/event-participants.ts';

const sold: ParticipantTicket[] = [
  { ticketId: 'ticket-ada', name: 'Account Ada', offerName: 'Door', state: 'checked' },
  { ticketId: 'ticket-bob', name: 'Bob', offerName: 'Final', state: 'unpaid' },
];

const guests: ParticipantGuest[] = [
  { guestId: 'guest-mina', name: 'Mina', email: 'mina@example.com', listName: 'DJ', observation: 'arrives late', state: 'open' },
];

const owners: ParticipantOwner[] = [
  { ticketId: 'ticket-ada', name: 'Ada Lovelace', email: 'ada@example.com' },
  { ticketId: 'ticket-bob', name: '', email: '' },
];

function rows(): ParticipantRow[] {
  return participantRows(sold, guests, owners);
}

describe('event participants', () => {
  it('uses the ticket owner name and keeps guests beside ticket holders', () => {
    const listed = rows();
    assert.deepEqual(
      listed.map((row) => row.name),
      ['Ada Lovelace', 'Bob', 'Mina'],
    );
    const ada = listed.find((row) => row.id === 'ticket-ada');
    assert.equal(ada?.email, 'ada@example.com');
    assert.equal(ada?.ticketType, 'Door');
    assert.equal(ada?.kind, 'ticket');
    assert.equal(ada?.note, '');
    assert.equal(listed.find((row) => row.id === 'guest-mina')?.kind, 'guest');
    assert.deepEqual(Object.keys(ada ?? {}).sort(), ['email', 'id', 'kind', 'name', 'note', 'status', 'ticketType']);
    assert.deepEqual(participantTicketTypes(listed), ['DJ', 'Door', 'Final']);
    assert.deepEqual(participantCounts(listed), { people: 3, checkedIn: 1, waiting: 2 });
  });

  it('returns everyone for an empty search and filters by text, ticket type, and status together', () => {
    const listed = rows();
    assert.deepEqual(
      filterParticipants(listed, '  ', '', 'all').map((row) => row.id),
      listed.map((row) => row.id),
    );
    assert.deepEqual(
      filterParticipants(listed, 'ada@example.com', '', 'all').map((row) => row.id),
      ['ticket-ada'],
    );
    assert.deepEqual(
      filterParticipants(listed, 'final', '', 'all').map((row) => row.id),
      ['ticket-bob'],
    );
    assert.deepEqual(
      filterParticipants(listed, 'arrives', '', 'all').map((row) => row.id),
      ['guest-mina'],
    );
    assert.deepEqual(
      filterParticipants(listed, 'a', 'Door', 'checked').map((row) => row.id),
      ['ticket-ada'],
    );
    assert.deepEqual(filterParticipants(listed, 'a', 'Final', 'checked'), []);
    assert.equal(filterParticipants(listed, 'mina', 'DJ', 'open')[0]?.kind, 'guest');
  });

  it('shows the participants tab on an existing event and not on a new event', () => {
    const form = readFileSync(new URL('../src/components/AdminEventForm.tsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('../app/admin/events/[id]/page.tsx', import.meta.url), 'utf8');
    const fresh = readFileSync(new URL('../app/admin/events/new/page.tsx', import.meta.url), 'utf8');
    assert.ok(form.indexOf("text('dashboardTab')") < form.indexOf("text('participantsTab')"));
    assert.ok(form.indexOf("text('participantsTab')") < form.indexOf("text('detailsTab')"));
    assert.equal(page.includes('participantRows'), true);
    assert.equal(page.includes('eventRoster'), true);
    assert.equal(fresh.includes('participantRows'), false);
    assert.equal(fresh.includes('participantsTab'), false);
  });
});
