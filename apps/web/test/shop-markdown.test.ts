import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShopMarkdown } from '../src/shop/markdown.ts';

function html(text: string): string {
  return renderToStaticMarkup(createElement(ShopMarkdown, { text }));
}

describe('shop markdown', () => {
  it('renders bold, italic, emoji, and a line break as text nodes', () => {
    const rendered = html('**bold** and *italic*\nsecond 🔥');
    assert.match(rendered, /<strong>bold<\/strong>/);
    assert.match(rendered, /<em>italic<\/em>/);
    assert.match(rendered, /<br\s*\/?>/);
    assert.match(rendered, /🔥/);
    assert.equal((rendered.match(/<p\b/g) ?? []).length, 1);
    assert.equal(rendered.includes('<b>'), false);
  });

  it('splits paragraphs on a blank line and shows raw HTML as text', () => {
    const rendered = html('one\n\ntwo <b>no</b>\n\n<img src=x onerror=alert(1)>');
    assert.equal((rendered.match(/<p\b/g) ?? []).length, 3);
    assert.equal(rendered.includes('<br'), false);
    assert.match(rendered, /&lt;b&gt;no&lt;\/b&gt;/);
    assert.equal(rendered.includes('<img'), false);
    assert.match(rendered, /&lt;img src=x onerror=alert\(1\)&gt;/);
  });

  it('keeps an unmatched star and lets bold contain italic', () => {
    assert.match(html('*nope'), /\*nope/);
    assert.match(html('2 * 3'), /2 \* 3/);
    const nested = html('**bold *in* side**');
    assert.match(nested, /<strong>bold <em>in<\/em> side<\/strong>/);
    const wrapped = html('*a **b** c*');
    assert.match(wrapped, /<em>a <strong>b<\/strong> c<\/em>/);
  });
});
