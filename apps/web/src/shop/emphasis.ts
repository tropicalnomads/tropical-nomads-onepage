export type EmphasisNode = { kind: 'text'; text: string } | { kind: 'bold' | 'italic'; children: EmphasisNode[] };

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

export function emphasisParts(text: string): EmphasisNode[] {
  const nodes: EmphasisNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    if (text.startsWith('**', cursor)) {
      const close = text.indexOf('**', cursor + 2);
      if (close !== -1) {
        nodes.push({ kind: 'bold', children: emphasisParts(text.slice(cursor + 2, close)) });
        cursor = close + 2;
        continue;
      }
    }
    if (text.startsWith('*', cursor) && !text.startsWith('**', cursor)) {
      const close = closingItalic(text, cursor + 1);
      if (close !== -1) {
        nodes.push({ kind: 'italic', children: emphasisParts(text.slice(cursor + 1, close)) });
        cursor = close + 1;
        continue;
      }
    }
    const next = nextMarker(text, cursor);
    const plain = text.slice(cursor, next);
    if (plain !== '') {
      nodes.push({ kind: 'text', text: plain });
    }
    cursor = next > cursor ? next : cursor + 1;
  }
  return nodes;
}
