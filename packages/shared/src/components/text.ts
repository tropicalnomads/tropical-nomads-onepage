import { tokens } from '../theme/tokens.ts';

export const textContract = {
  tokens: ['color.brand.navy', 'font.sans', 'font.size.base'],
} as const;

export interface TextView {
  type: 'Text';
  children: string;
  color: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
}

export function textView(children: string): TextView {
  return {
    type: 'Text',
    children,
    color: tokens.color.brand.navy,
    fontFamily: tokens.font.sans,
    fontSize: tokens.font.size.base.size,
    lineHeight: tokens.font.size.base.lineHeight,
  };
}
