import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { catalogAsset } from '../src/events/assets.ts';
import { loadUpcomingEvents } from '../src/events/load.ts';
import { shellCopy } from '../src/i18n/copy.ts';

describe('upcoming events', () => {
  it('loads the public list from the API without a login or a payment field', async () => {
    const events = await loadUpcomingEvents();
    assert.ok(events.length > 0);
    const titles = events.map((event) => event.title);
    assert.equal(titles.includes(''), false);
    const stamps = events.map((event) => new Date(event.dateStart).getTime());
    assert.deepEqual(stamps, [...stamps].sort((left, right) => left - right));
    for (const event of events) {
      assert.equal(JSON.stringify(event).includes('secret'), false);
      assert.equal(JSON.stringify(event).includes('cardNumber'), false);
      assert.equal('price' in event, false);
      assert.equal(event.inAppOffers.length, 0);
      if (event.ticketUrl) {
        assert.equal(new URL(event.ticketUrl).protocol, 'https:');
      }
      if (event.timetableUrl) {
        assert.equal(new URL(event.timetableUrl).origin, 'https://timetable.tropical-nomads.com');
      }
      if (event.bannerSrc) {
        assert.equal(event.bannerSrc.startsWith('/catalog-assets/banners/'), true);
        assert.equal(event.bannerSrc.includes('..'), false);
      }
      for (const partner of event.partners) {
        assert.ok(partner.name.trim().length > 0);
        if (partner.href) {
          assert.equal(new URL(partner.href).protocol, 'https:');
        }
      }
    }
    const withPartner = events.find((event) => event.partners.length > 0);
    assert.ok(withPartner);
    const forestShankara = events.flatMap((event) => event.partners).find((partner) => partner.id === 'forest-shankara');
    assert.equal(forestShankara?.logoFit, 'contain');
    const withBanner = events.find((event) => event.bannerSrc);
    assert.ok(withBanner);
  });

  it('serves a banner file and refuses a path outside that directory', () => {
    assert.ok(catalogAsset('banners', '118352.jpg'));
    assert.equal(catalogAsset('banners', '../events.json'), undefined);
    assert.equal(catalogAsset('banners', '..%2Fevents.json'), undefined);
    assert.equal(catalogAsset('events', 'events.json'), undefined);
    assert.equal(catalogAsset('partners', 'psy-groove.png')?.contentType, 'image/png');
  });

  it('keeps the one-pager list and translates only the interface', () => {
    const list = readFileSync(new URL('../../one-pager/src/components/UpcomingEventsList.tsx', import.meta.url), 'utf8');
    const data = readFileSync(new URL('../../one-pager/src/lib/data.ts', import.meta.url), 'utf8');
    assert.match(list, /export function UpcomingEventsList/);
    assert.match(data, /\/data\/events\.json/);
    assert.deepEqual(Object.keys(shellCopy.en.events).sort(), Object.keys(shellCopy.pt.events).sort());
    for (const language of locales) {
      for (const value of Object.values(shellCopy[language].events)) {
        assert.notEqual(value.trim(), '');
      }
    }
    const page = readFileSync(new URL('../src/components/UpcomingEvents.tsx', import.meta.url), 'utf8');
    const onePagerList = readFileSync(new URL('../../one-pager/src/components/UpcomingEventsList.tsx', import.meta.url), 'utf8');
    assert.equal(page.includes('issueTicketAction'), true);
    assert.equal(page.includes('checkout'), false);
    assert.equal(page.includes('markPaymentConfirmed'), false);
    assert.equal(page.includes('recordRefund'), false);
    assert.equal(onePagerList.includes('issueTicketAction'), false);
    assert.equal(onePagerList.includes('<form'), false);
  });
});