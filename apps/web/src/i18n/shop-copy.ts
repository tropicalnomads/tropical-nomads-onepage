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
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  total: string;
  buy: string;
  note: string;
  view: string;
  back: string;
  decrease: string;
  increase: string;
  delivery: string;
  continue: string;
  cartAria: string;
  missingTitle: string;
  missingBody: string;
  left: string;
  added: string;
  viewCart: string;
  close: string;
  checkout: string;
  next: string;
  review: string;
  backCart: string;
  backAddress: string;
  subtotal: string;
  addressIntro: string;
  savedAddress: string;
  profileAddress: string;
  useAddress: string;
  saveAddress: string;
  saveAddressHelp: string;
  lookup: string;
  lookingUp: string;
  lookupFound: string;
  lookupMissing: string;
  lookupHelp: string;
  searchCountry: string;
  noCountryMatches: string;
  selectCountry: string;
  ireland: string;
  portugal: string;
  unitedKingdom: string;
  germany: string;
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
    name: 'Full name',
    line1: 'Address line 1',
    line2: 'Apartment, suite, or unit',
    city: 'City',
    region: 'State / region',
    postalCode: 'Postal code',
    country: 'Country',
    total: 'Total',
    buy: 'Buy',
    note: 'Buy opens WhatsApp with the shirts, sizes, delivery address, and the total. We answer there.',
    view: 'View shirt',
    back: 'Back to shop',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    delivery: 'Delivery',
    continue: 'Continue shopping',
    cartAria: 'Open cart',
    missingTitle: 'That shirt is not in the shop.',
    missingBody: 'The shop has the two embroidered T-shirts.',
    left: '{count} left',
    added: 'Added to cart',
    viewCart: 'View cart',
    close: 'Close',
    checkout: 'Proceed to checkout',
    next: 'Continue',
    review: 'Review',
    backCart: 'Back to cart',
    backAddress: 'Back to address',
    subtotal: 'Subtotal',
    addressIntro: 'Choose a saved address or enter where you want this order delivered.',
    savedAddress: 'Saved delivery address',
    profileAddress: 'From your profile',
    useAddress: 'Use this address',
    saveAddress: 'Save this address to my account',
    saveAddressHelp: 'It will be ready the next time you check out.',
    lookup: 'Find address',
    lookingUp: 'Finding address…',
    lookupFound: 'City and region added from the postal code.',
    lookupMissing: 'We could not find that postal code. You can still enter the address manually.',
    lookupHelp: 'Postal lookup uses public postal data and OpenStreetMap after you ask us to find the address.',
    searchCountry: 'Search countries',
    noCountryMatches: 'No countries match',
    selectCountry: 'Select a country',
    ireland: 'Ireland',
    portugal: 'Portugal',
    unitedKingdom: 'United Kingdom',
    germany: 'Germany',
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
    name: 'Nome completo',
    line1: 'Endereço',
    line2: 'Apartamento, bloco ou complemento',
    city: 'Cidade',
    region: 'Estado / região',
    postalCode: 'Código postal',
    country: 'País',
    total: 'Total',
    buy: 'Comprar',
    note: 'Comprar abre o WhatsApp com as camisetas, tamanhos, endereço de entrega e o total. Respondemos por lá.',
    view: 'Ver camiseta',
    back: 'Voltar à loja',
    decrease: 'Diminuir quantidade',
    increase: 'Aumentar quantidade',
    delivery: 'Entrega',
    continue: 'Continuar comprando',
    cartAria: 'Abrir carrinho',
    missingTitle: 'Essa camiseta não está na loja.',
    missingBody: 'A loja tem as duas camisetas bordadas.',
    left: '{count} restantes',
    added: 'Adicionado ao carrinho',
    viewCart: 'Ver carrinho',
    close: 'Fechar',
    checkout: 'Finalizar compra',
    next: 'Continuar',
    review: 'Revisão',
    backCart: 'Voltar ao carrinho',
    backAddress: 'Voltar ao endereço',
    subtotal: 'Subtotal',
    addressIntro: 'Escolha um endereço salvo ou informe onde deseja receber este pedido.',
    savedAddress: 'Endereço de entrega salvo',
    profileAddress: 'Dados do seu perfil',
    useAddress: 'Usar este endereço',
    saveAddress: 'Salvar este endereço na minha conta',
    saveAddressHelp: 'Ele estará pronto na próxima compra.',
    lookup: 'Buscar endereço',
    lookingUp: 'Buscando endereço…',
    lookupFound: 'Cidade e região preenchidas pelo código postal.',
    lookupMissing: 'Não encontramos esse código postal. Você ainda pode preencher o endereço manualmente.',
    lookupHelp: 'A busca usa dados postais públicos e o OpenStreetMap quando você solicita o endereço.',
    searchCountry: 'Buscar país',
    noCountryMatches: 'Nenhum país encontrado',
    selectCountry: 'Selecione um país',
    ireland: 'Irlanda',
    portugal: 'Portugal',
    unitedKingdom: 'Reino Unido',
    germany: 'Alemanha',
  },
};

export function shopText<K extends keyof ShopCopy>(language: Locale, key: K): string {
  return presentText(language, `shop.${key}`, shopCopy[language][key]);
}

export function shopProductMeta(language: Locale, id: 'hw' | 'pg'): string {
  switch (id) {
    case 'hw':
      return shopText(language, 'metaHw');
    case 'pg':
      return shopText(language, 'metaPg');
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

export function shopLeft(language: Locale, count: number): string {
  return shopText(language, 'left').replace('{count}', String(count));
}
