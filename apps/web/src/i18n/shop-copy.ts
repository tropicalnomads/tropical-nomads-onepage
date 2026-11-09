import { type Locale } from 'tropical-nomads-shared';
import { presentText } from './copy.ts';

export interface ShopCopy {
  title: string;
  subtitle: string;
  price: string;
  metaHw: string;
  metaPg: string;
  inStock: string;
  size: string;
  quantity: string;
  add: string;
  cart: string;
  empty: string;
  remove: string;
  name: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
  total: string;
  buy: string;
  note: string;
}

export const shopCopy: Record<Locale, ShopCopy> = {
  en: {
    title: 'Shop',
    subtitle: 'The two embroidered T-shirts from the Tropical Nomads page. Nothing is charged here. Buy sends the order on WhatsApp.',
    price: '50',
    metaHw: 'Embroidered T-shirt · glows under UV',
    metaPg: 'Embroidered T-shirt · logo on the front, artwork on the back',
    inStock: 'in stock',
    size: 'Size',
    quantity: 'Quantity',
    add: 'Add to cart',
    cart: 'Cart',
    empty: 'The cart is empty.',
    remove: 'Remove',
    name: 'Name',
    line1: 'Street and number',
    city: 'City',
    postalCode: 'Postal code',
    country: 'Country',
    total: 'Total',
    buy: 'Buy',
    note: 'Buy opens WhatsApp with the shirts, sizes, delivery address, and the total. We answer there.',
  },
  pt: {
    title: 'Loja',
    subtitle: 'As duas camisetas bordadas da página da Tropical Nomads. Nada é cobrado aqui. Comprar envia o pedido no WhatsApp.',
    price: '50',
    metaHw: 'Camiseta bordada · brilha no UV',
    metaPg: 'Camiseta bordada · logo na frente, arte nas costas',
    inStock: 'em estoque',
    size: 'Tamanho',
    quantity: 'Quantidade',
    add: 'Adicionar ao carrinho',
    cart: 'Carrinho',
    empty: 'O carrinho está vazio.',
    remove: 'Remover',
    name: 'Nome',
    line1: 'Rua e número',
    city: 'Cidade',
    postalCode: 'Código postal',
    country: 'País',
    total: 'Total',
    buy: 'Comprar',
    note: 'Comprar abre o WhatsApp com as camisetas, tamanhos, endereço de entrega e o total. Respondemos por lá.',
  },
};

export function shopText<K extends keyof ShopCopy>(language: Locale, key: K): string {
  return presentText(language, `shop.${key}`, shopCopy[language][key]);
}
