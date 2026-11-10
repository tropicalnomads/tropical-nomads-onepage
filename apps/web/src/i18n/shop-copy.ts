import { type Locale } from 'tropical-nomads-shared';
import { presentText } from './copy.ts';

export interface ShopCopy {
  title: string;
  subtitle: string;
  price: string;
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
  soldOut: string;
  soldOutLabel: string;
  orderFailed: string;
  addProduct: string;
  editProduct: string;
  orders: string;
  orderReady: string;
  openWhatsapp: string;
  orderNumber: string;
  missingOrder: string;
  saveProduct: string;
  productSaved: string;
  productInvalid: string;
  titleLabel: string;
  textEn: string;
  textPt: string;
  priceLabel: string;
  imageLabel: string;
  imageHelp: string;
  keepImage: string;
  stockLabel: string;
  unpaid: string;
  paid: string;
  noOrders: string;
  backShop: string;
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
    subtitle: 'Embroidered T-shirts from Tropical Nomads. Nothing is charged here. Buy saves the order and sends it on WhatsApp.',
    price: '50',
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
    note: 'Buy saves the order and updates the stock. The next page shows the order number and opens WhatsApp. Nothing is charged here.',
    soldOut: 'One of these sizes just sold out. The order was not saved.',
    soldOutLabel: 'Sold out',
    orderFailed: 'The order was not saved. Your cart is unchanged.',
    addProduct: 'Add product',
    editProduct: 'Edit',
    orders: 'Orders',
    orderReady: 'Your order is saved.',
    openWhatsapp: 'Open WhatsApp',
    orderNumber: 'Order',
    missingOrder: 'This browser does not have an order to show.',
    saveProduct: 'Save product',
    productSaved: 'The product is saved.',
    productInvalid: 'The product was not saved. Check the title, both texts, the price, and the image.',
    titleLabel: 'Title',
    textEn: 'English text',
    textPt: 'Portuguese text',
    priceLabel: 'Price (EUR)',
    imageLabel: 'Image',
    imageHelp: 'JPEG, PNG, or WebP. At most 5 MB.',
    keepImage: 'Leave this empty to keep the current image. A chosen file replaces it.',
    stockLabel: 'Stock',
    unpaid: 'Unpaid',
    paid: 'Paid',
    noOrders: 'No shop orders yet.',
    backShop: 'Back to shop',
    view: 'View shirt',
    back: 'Back to shop',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    delivery: 'Delivery',
    continue: 'Continue shopping',
    cartAria: 'Open cart',
    missingTitle: 'That shirt is not in the shop.',
    missingBody: 'Go back to the shop to see what is available.',
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
    subtitle: 'Camisetas bordadas da Tropical Nomads. Nada é cobrado aqui. Comprar grava o pedido e envia no WhatsApp.',
    price: '50',
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
    note: 'Comprar grava o pedido e atualiza o estoque. A página seguinte mostra o número do pedido e abre o WhatsApp. Nada é cobrado aqui.',
    soldOut: 'Um destes tamanhos acabou de esgotar. O pedido não foi gravado.',
    soldOutLabel: 'Esgotado',
    orderFailed: 'O pedido não foi gravado. O carrinho continua igual.',
    addProduct: 'Adicionar produto',
    editProduct: 'Editar',
    orders: 'Pedidos',
    orderReady: 'O pedido foi gravado.',
    openWhatsapp: 'Abrir WhatsApp',
    orderNumber: 'Pedido',
    missingOrder: 'Este navegador não tem um pedido para mostrar.',
    saveProduct: 'Salvar produto',
    productSaved: 'O produto foi salvo.',
    productInvalid: 'O produto não foi salvo. Confira o título, os dois textos, o preço e a imagem.',
    titleLabel: 'Título',
    textEn: 'Texto em inglês',
    textPt: 'Texto em português',
    priceLabel: 'Preço (EUR)',
    imageLabel: 'Imagem',
    imageHelp: 'JPEG, PNG ou WebP. No máximo 5 MB.',
    keepImage: 'Deixe vazio para manter a imagem atual. Um arquivo escolhido substitui essa imagem.',
    stockLabel: 'Estoque',
    unpaid: 'Não pago',
    paid: 'Pago',
    noOrders: 'Ainda não há pedidos da loja.',
    backShop: 'Voltar à loja',
    view: 'Ver camiseta',
    back: 'Voltar à loja',
    decrease: 'Diminuir quantidade',
    increase: 'Aumentar quantidade',
    delivery: 'Entrega',
    continue: 'Continuar comprando',
    cartAria: 'Abrir carrinho',
    missingTitle: 'Essa camiseta não está na loja.',
    missingBody: 'Volte à loja para ver o que está disponível.',
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

export function shopLeft(language: Locale, count: number): string {
  return shopText(language, 'left').replace('{count}', String(count));
}
