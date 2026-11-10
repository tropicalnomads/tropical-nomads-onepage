import { createElement, type ReactNode } from 'react';
import { emphasisParts, type EmphasisNode } from './emphasis.ts';

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

function inlineNodes(nodes: readonly EmphasisNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.kind) {
      case 'text':
        return node.text;
      case 'bold':
        return createElement('strong', { key: `${keyPrefix}-b-${index}` }, inlineNodes(node.children, `${keyPrefix}-b-${index}`));
      case 'italic':
        return createElement('em', { key: `${keyPrefix}-i-${index}` }, inlineNodes(node.children, `${keyPrefix}-i-${index}`));
      default: {
        const unexpected: never = node;
        return unexpected;
      }
    }
  });
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
        children.push(...inlineNodes(emphasisParts(line), `p${paragraphIndex}-l${lineIndex}`));
      }
      return createElement('p', { key: `p-${paragraphIndex}`, className: 'm-0' }, children);
    }),
  );
}
