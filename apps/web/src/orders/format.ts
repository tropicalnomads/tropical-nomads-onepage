import type { Locale } from 'tropical-nomads-shared';
import { sizeLabel, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';

export function orderWhen(value: string, language: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function isShopSize(size: string): size is ShopSizeCode {
  switch (size) {
    case 'P':
    case 'M':
    case 'G':
    case 'GG':
    case '2XL':
      return true;
    default:
      return false;
  }
}

export function orderSizeLabel(size: string, language: Locale): string | undefined {
  return isShopSize(size) ? sizeLabel(size, language) : undefined;
}
