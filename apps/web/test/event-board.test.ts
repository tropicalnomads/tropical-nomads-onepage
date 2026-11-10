import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ManagedParty, PartyPublication } from 'tropical-nomads-api/parties';
import { formatEventDate } from 'tropical-nomads-shared';
import { eventBoardDetails, eventPhase, eventTicketSummary, groupEventBoard } from '../src/admin/event-board.ts';
import { shellCopy } from '../src/i18n/copy.ts';

const clock = new Date('2026-06-15T12:00:00.000Z');

type StoredPublication = ManagedParty['publication'];
type PublicationStaysBinary = Exclude<StoredPublication, 'draft' | 'published'> extends never
  ? 'ended' extends StoredPublication
    ? never
    : true
  : never;

function party(id: string, publication: PartyPublication, dateStart: string, dateEnd?: string): ManagedParty {
  return {
    id,
    origin: 'admin',
    publication,
    revisions: [],
    offersManaged: false,
    event: {
      id,
      title: id,
      dateStart,
      ...(dateEnd === undefined ? {} : { dateEnd }),
    },
  };
}

describe('admin event board', () => {
  it('keeps stored publication as draft or published and derives all three phases', () => {
    const publicationStaysDraftOrPublished: PublicationStaysBinary = true;
    assert.equal(publicationStaysDraftOrPublished, true);
    assert.equal(eventPhase(party('draft-future', 'draft', '2026-12-01T00:00:00.000Z'), clock), 'draft');
    assert.equal(eventPhase(party('draft-past', 'draft', '2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z'), clock), 'draft');
    assert.equal(eventPhase(party('live', 'published', '2026-08-01T00:00:00.000Z'), clock), 'published');
    assert.equal(eventPhase(party('past-start', 'published', '2024-01-01T00:00:00.000Z'), clock), 'ended');
    assert.equal(eventPhase(party('still-open', 'published', '2026-06-01T00:00:00.000Z', '2026-06-20T00:00:00.000Z'), clock), 'published');
    assert.equal(eventPhase(party('closed', 'published', '2026-06-10T00:00:00.000Z', '2026-06-14T00:00:00.000Z'), clock), 'ended');
    assert.equal(eventPhase(party('end-wins', 'published', '2026-12-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'), clock), 'ended');
    assert.equal(eventPhase(party('bad-end', 'published', '2020-01-01T00:00:00.000Z', 'not-a-date'), clock), 'ended');
    assert.equal(eventPhase(party('blank-end', 'published', '2020-05-01T00:00:00.000Z', '   '), clock), 'ended');
    assert.equal(eventPhase(party('bad-end-future', 'published', '2026-12-01T00:00:00.000Z', ''), clock), 'published');
  });

  it('sorts coming up by start ascending and ended by start descending', () => {
    const draftPast = party('draft-past', 'draft', '2020-01-02T00:00:00.000Z');
    const draftSoon = party('draft-soon', 'draft', '2026-07-01T00:00:00.000Z');
    const publishedSoon = party('published-soon', 'published', '2026-08-01T00:00:00.000Z');
    const publishedLater = party('published-later', 'published', '2026-12-01T00:00:00.000Z');
    const stillOpen = party('still-open', 'published', '2026-06-01T00:00:00.000Z', '2026-06-20T00:00:00.000Z');
    const endedNew = party('ended-new', 'published', '2024-03-01T00:00:00.000Z', '2024-03-03T00:00:00.000Z');
    const endedOld = party('ended-old', 'published', '2019-05-01T00:00:00.000Z');
    const endedRecent = party('ended-recent', 'published', '2026-06-10T00:00:00.000Z', '2026-06-14T00:00:00.000Z');
    const parties = [endedOld, publishedLater, draftSoon, endedRecent, stillOpen, draftPast, endedNew, publishedSoon];
    const grouped = groupEventBoard(parties, clock);
    assert.deepEqual(
      grouped.comingUp.map((item) => item.id),
      ['draft-past', 'still-open', 'draft-soon', 'published-soon', 'published-later'],
    );
    assert.deepEqual(
      grouped.ended.map((item) => item.id),
      ['ended-recent', 'ended-new', 'ended-old'],
    );
    assert.deepEqual(
      parties.map((item) => item.id),
      ['ended-old', 'published-later', 'draft-soon', 'ended-recent', 'still-open', 'draft-past', 'ended-new', 'published-soon'],
    );
    assert.equal(draftPast.publication, 'draft');
    assert.equal(endedRecent.publication, 'published');
  });

  it('summarizes euro tickets and formats the date with the shared formatter', () => {
    const detailed: ManagedParty = {
      ...party('desk', 'published', '2026-08-01T18:00:00.000Z'),
      event: {
        id: 'desk',
        title: 'Forest',
        dateStart: '2026-08-01T18:00:00.000Z',
        timezone: 'UTC',
        venue: { name: 'Dock', city: 'Lisbon' },
        cardArtists: ['Ana', ' ', 'Bruno'],
        offers: [
          { name: 'Early', amount: 18, currency: 'EUR', capacity: 40 },
          { name: 'Door', amount: 12, currency: 'EUR', capacity: 10 },
          { name: 'Guest', amount: 0, currency: 'EUR', capacity: 5 },
        ],
      },
    };
    const details = eventBoardDetails(detailed, 'en', clock);
    assert.equal(details.phase, 'published');
    assert.equal(details.place, 'Dock, Lisbon');
    assert.equal(details.lineup, 'Ana · Bruno');
    assert.equal(details.when, formatEventDate(detailed.event, 'en'));
    assert.deepEqual(details.stub, { weekday: 'Sat', day: '1', month: 'Aug' });
    assert.deepEqual(details.tickets, { typeCount: 2, lowestEuro: 12, capacity: 50 });
    assert.equal(eventTicketSummary(undefined), undefined);
    assert.equal(eventTicketSummary([]), undefined);
  });

  it('names ended, the sections, ticket totals, and status counts in both languages', () => {
    assert.equal(shellCopy.en.admin.ended, 'Ended');
    assert.equal(shellCopy.pt.admin.ended, 'Encerrado');
    assert.equal(shellCopy.en.admin.draft, 'Draft');
    assert.equal(shellCopy.pt.admin.draft, 'Rascunho');
    assert.equal(shellCopy.en.admin.published, 'Published');
    assert.equal(shellCopy.pt.admin.published, 'Publicado');
    assert.deepEqual(Object.keys(shellCopy.en.admin).sort(), Object.keys(shellCopy.pt.admin).sort());
    for (const key of ['comingUp', 'endedSection', 'statusCount', 'ticketType', 'ticketTypes', 'ticketFrom', 'ticketCapacity'] as const) {
      assert.notEqual(shellCopy.en.admin[key].trim(), '', key);
      assert.notEqual(shellCopy.pt.admin[key].trim(), '', key);
    }
    assert.equal(shellCopy.en.admin.comingUp, 'Coming up');
    assert.equal(shellCopy.pt.admin.comingUp, 'A seguir');
    assert.equal(shellCopy.en.admin.endedSection, 'Ended');
    assert.equal(shellCopy.pt.admin.endedSection, 'Encerrados');
    assert.equal(shellCopy.en.admin.statusCount.includes('{count}'), true);
    assert.equal(shellCopy.en.admin.statusCount.includes('{status}'), true);
    assert.equal(shellCopy.pt.admin.statusCount.includes('{count}'), true);
    assert.equal(shellCopy.pt.admin.statusCount.includes('{status}'), true);
    assert.equal(shellCopy.en.admin.ticketTypes.includes('{count}'), true);
    assert.equal(shellCopy.pt.admin.ticketType.includes('{count}'), true);
    assert.equal(shellCopy.en.admin.ticketFrom.includes('{price}'), true);
    assert.equal(shellCopy.pt.admin.ticketFrom.includes('{price}'), true);
    assert.equal(shellCopy.en.admin.ticketCapacity.includes('{count}'), true);
    assert.equal(shellCopy.pt.admin.ticketCapacity.includes('{count}'), true);
  });
});
