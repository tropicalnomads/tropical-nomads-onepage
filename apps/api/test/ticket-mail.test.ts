import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { notifyTicketHolders, type TicketMailMessage } from '../src/ticket-mail.ts';

const secret = 'not-the-party-secret-value';

function ticket(id: string, email: string, name: string) {
  return { id, ownerName: name, ownerEmail: email, secret: `${secret}-${id}` };
}

describe('ticket mail', () => {
  it('sends one message per checkout email and keeps the other ticket out of it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-mail-'));
    const messages: TicketMailMessage[] = [];
    const unsent = await notifyTicketHolders({
      tickets: [ticket('ticket-aaaaaaaaaaaaaaaaaa', 'ada@example.com', 'Ada Nomad'), ticket('ticket-bbbbbbbbbbbbbbbbbb', 'grace@example.com', 'Grace Hopper')],
      title: 'Tropical Groove',
      offerName: 'Early',
      language: 'en',
      now: '2026-11-17T21:00:00.000Z',
      root,
      env: {},
      deliver: async (message) => {
        messages.push(message);
      },
    });
    assert.deepEqual(unsent, []);
    assert.equal(messages.length, 2);
    const ada = messages.find((message) => message.to === 'ada@example.com');
    const grace = messages.find((message) => message.to === 'grace@example.com');
    assert.equal(ada?.text.includes('Ada Nomad'), true);
    assert.equal(ada?.text.includes('Grace Hopper'), false);
    assert.equal(ada?.text.includes(secret), false);
    assert.equal(ada?.subject.includes(secret), false);
    assert.equal(ada?.files.length, 1);
    assert.equal(ada?.files[0]?.filename, 'ticket-1.pdf');
    assert.equal(ada?.files[0]?.pdf.subarray(0, 5).toString('utf8'), '%PDF-');
    assert.equal(grace?.files.length, 1);
    const recorded = readFileSync(join(root, 'email-sends.json'), 'utf8');
    assert.equal(recorded.includes(secret), false);
    assert.equal(recorded.includes('ada@example.com'), true);
    assert.equal(recorded.includes('grace@example.com'), true);
    assert.equal(recorded.includes('ticket-purchase'), true);
  });

  it('keeps the tickets and names every address when mail is not configured', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-mail-'));
    const unsent = await notifyTicketHolders({
      tickets: [ticket('ticket-cccccccccccccccccc', 'ada@example.com', 'Ada Nomad'), ticket('ticket-dddddddddddddddddd', 'ada@example.com', 'Ada Nomad')],
      title: 'Tropical Groove',
      offerName: 'Early',
      language: 'pt',
      now: '2026-11-17T21:00:00.000Z',
      root,
      env: {},
    });
    assert.deepEqual(unsent, ['ada@example.com']);
    const recorded = JSON.parse(readFileSync(join(root, 'email-sends.json'), 'utf8')) as { records: { recipient: string }[] };
    assert.equal(recorded.records.length, 1);
    assert.equal(recorded.records[0]?.recipient, 'ada@example.com');
  });
});
