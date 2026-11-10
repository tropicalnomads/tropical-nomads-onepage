import { shopSizeCodes, type ShopImageAction } from './shop-values.ts';

export interface ShopProductSubmission {
  id?: string;
  name: string;
  description: string;
  amount: string;
  stock: Record<(typeof shopSizeCodes)[number], number>;
  imageAction: ShopImageAction;
  imageBase64?: string;
  hidden?: boolean;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function hiddenValue(value: string): boolean | undefined | 'invalid' {
  switch (value) {
    case '':
      return undefined;
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return 'invalid';
  }
}

function imageAction(formData: FormData): ShopImageAction | undefined {
  const values = formData.getAll('imageAction').flatMap((value) => (typeof value === 'string' ? [value] : []));
  if (values.includes('remove')) {
    return 'remove';
  }
  if (values.every((value) => value === '' || value === 'keep')) {
    return 'keep';
  }
  return undefined;
}

export async function shopProductSubmission(formData: FormData): Promise<ShopProductSubmission | undefined> {
  const stock: ShopProductSubmission['stock'] = { P: 0, M: 0, G: 0, GG: 0, '2XL': 0 };
  for (const size of shopSizeCodes) {
    const raw = field(formData, `stock-${size}`);
    if (!/^\d{1,3}$/.test(raw)) {
      return undefined;
    }
    stock[size] = Number(raw);
  }
  const action = imageAction(formData);
  const hidden = hiddenValue(field(formData, 'hidden'));
  if (!action || hidden === 'invalid') {
    return undefined;
  }
  const file = formData.get('image');
  let imageBase64: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5_000_000) {
      return undefined;
    }
    imageBase64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  }
  const id = field(formData, 'id');
  return {
    ...(id !== '' ? { id } : {}),
    name: field(formData, 'name'),
    description: field(formData, 'description'),
    amount: field(formData, 'amount'),
    stock,
    imageAction: action,
    ...(hidden === undefined ? {} : { hidden }),
    ...(imageBase64 ? { imageBase64 } : {}),
  };
}
