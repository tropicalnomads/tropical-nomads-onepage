import { createElement, type ReactNode } from 'react';

function paragraphsOf(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.split(/\n(?:[ \t]*\n)+/).flatMap((paragraph) => {
    const lines = paragraph.split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    if (lines.every((line) => line.trim() === '')) {
      return [];
    }
    return [lines.join('\n')];
  });
}

function closingItalic(text: string, from: number): number {
  for (let index = from; index < text.length; index += 1) {
    if (text[index] !== '*') {
      continue;
    }
    if (text.startsWith('**', index)) {
      index += 1;
      continue;
    }
    return index;
  }
  return -1;
}

function nextMarker(text: string, from: number): number {
  const found = text.indexOf('*', from + 1);
  return found === -1 ? text.length : found;
}

function inlineNodes(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    if (text.startsWith('**', cursor)) {
      const close = text.indexOf('**', cursor + 2);
      if (close !== -1) {
        nodes.push(
          createElement('strong', { key: `${keyPrefix}-b-${cursor}` }, inlineNodes(text.slice(cursor + 2, close), `${keyPrefix}-b-${cursor}`)),
        );
        cursor = close + 2;
        continue;
      }
    }
    if (text.startsWith('*', cursor) && !text.startsWith('**', cursor)) {
      const close = closingItalic(text, cursor + 1);
      if (close !== -1) {
        nodes.push(createElement('em', { key: `${keyPrefix}-i-${cursor}` }, inlineNodes(text.slice(cursor + 1, close), `${keyPrefix}-i-${cursor}`)));
        cursor = close + 1;
        continue;
      }
    }
    const next = nextMarker(text, cursor);
    const plain = text.slice(cursor, next);
    if (plain !== '') {
      nodes.push(plain);
    }
    cursor = next > cursor ? next : cursor + 1;
  }
  return nodes;
}

export function ShopMarkdown({ text }: { text: string }): ReactNode {
  const paragraphs = paragraphsOf(text);
  if (paragraphs.length === 0) {
    return null;
  }
  return createElement(
    'div',
    { className: 'space-y-2' },
    paragraphs.map((paragraph, paragraphIndex) => {
      const lines = paragraph.split('\n');
      const children: ReactNode[] = [];
      for (const [lineIndex, line] of lines.entries()) {
        if (lineIndex > 0) {
          children.push(createElement('br', { key: `br-${paragraphIndex}-${lineIndex}` }));
        }
        children.push(...inlineNodes(line, `p${paragraphIndex}-l${lineIndex}`));
      }
      return createElement('p', { key: `p-${paragraphIndex}`, className: 'm-0' }, children);
    }),
  );
}
