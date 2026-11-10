import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { flyerAfter, uploadedEventFlyer } from '../src/admin/event-image.ts';
import { eventPhase } from '../src/admin/event-board.ts';
import { instantFromWall, wallClock } from '../src/admin/event-time.ts';
import { lineupArtists } from '../src/artists/profile.ts';
import { emphasisParts } from '../src/shop/emphasis.ts';
import { eventCropSize, shopCropSize } from '../src/shop/crop-image.ts';

const clock = new Date('2026-06-15T12:00:00.000Z');

describe('event editor', () => {
  it('keeps the shop crop at 1000 by 1250 and uses a 3:4 flyer', () => {
    assert.deepEqual(shopCropSize, { width: 1000, height: 1250 });
    assert.deepEqual(eventCropSize, { width: 1200, height: 1600 });
    assert.equal(eventCropSize.width / eventCropSize.height, 0.75);
  });

  it('keeps, replaces, and removes a flyer without dropping an external image on remove', () => {
    assert.equal(flyerAfter('https://cdn.example.com/flyer.jpg', 'keep', 'party-1'), 'https://cdn.example.com/flyer.jpg');
    assert.equal(flyerAfter('https://cdn.example.com/flyer.jpg', 'replace', 'party-1'), '/events/media/party-1');
    assert.equal(flyerAfter('/events/media/party-1', 'remove', 'party-1'), '');
    assert.equal(flyerAfter('https://cdn.example.com/flyer.jpg', 'remove', 'party-1'), 'https://cdn.example.com/flyer.jpg');
    assert.equal(uploadedEventFlyer('/events/media/party-1'), '/events/media/party-1');
    assert.equal(uploadedEventFlyer('https://cdn.example.com/flyer.jpg'), undefined);
  });

  it('leaves event phase derived from publication and the finish time', () => {
    assert.equal(eventPhase({ publication: 'draft', event: { dateStart: '2020-01-01T00:00:00.000Z' } }, clock), 'draft');
    assert.equal(
      eventPhase({ publication: 'published', event: { dateStart: '2026-01-01T00:00:00.000Z', dateEnd: '2026-01-02T00:00:00.000Z' } }, clock),
      'ended',
    );
    assert.equal(eventPhase({ publication: 'published', event: { dateStart: '2026-12-01T00:00:00.000Z' } }, clock), 'published');
  });

  it('converts a wall-clock start in the event timezone', () => {
    assert.equal(instantFromWall('2026-11-20', '19:00', 'Europe/Dublin'), '2026-11-20T19:00:00.000Z');
    assert.deepEqual(wallClock('2026-11-20T19:00:00.000Z', 'Europe/Dublin'), { date: '2026-11-20', time: '19:00' });
  });

  it('keeps bold and italic and points a lineup name at the artist', () => {
    assert.deepEqual(emphasisParts('**bold** and *italic*'), [
      { kind: 'bold', children: [{ kind: 'text', text: 'bold' }] },
      { kind: 'text', text: ' and ' },
      { kind: 'italic', children: [{ kind: 'text', text: 'italic' }] },
    ]);
    assert.deepEqual(lineupArtists(['Mina', 'Guest'], [{ id: 'mina', name: 'Mina' }]), [
      { name: 'Mina', artistId: 'mina' },
      { name: 'Guest' },
    ]);
  });
});
