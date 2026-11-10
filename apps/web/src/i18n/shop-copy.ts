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
  admin: string;
  orders: string;
  orderReady: string;
  openWhatsapp: string;
  orderNumber: string;
  missingOrder: string;
  saveProduct: string;
  productSaved: string;
  productInvalid: string;
  titleLabel: string;
  descriptionLabel: string;
  removeImage: string;
  uploadImage: string;
  replaceImage: string;
  noImage: string;
  imagePlaceholder: string;
  imageInvalid: string;
  productImage: string;
  imageRatio: string;
  cropImage: string;
  cropHelp: string;
  zoom: string;
  cancel: string;
  useImage: string;
  croppingImage: string;
  productDetails: string;
  detailsHelp: string;
  editorIntro: string;
  boldText: string;
  italicText: string;
  markdownHelp: string;
  preview: string;
  stockHelp: string;
  pieces: string;
  savingProduct: string;
  visibility: string;
  visibleHelp: string;
  hiddenHelp: string;
  showProduct: string;
  hideProduct: string;
  visibleProduct: string;
  hiddenProduct: string;
  deleteProduct: string;
  deleteWarning: string;
  confirmDelete: string;
  deletingProduct: string;
  deleteFailed: string;
  reviewChanges: string;
  checkProduct: string;
  reviewHelp: string;
  editChanges: string;
  saveChanges: string;
  productCreated: string;
  productUpdated: string;
  createdNext: string;
  updatedNext: string;
  addAnotherProduct: string;
  continueEditing: string;
  goToShop: string;
  productsLabel: string;
  noProducts: string;
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
    admin: 'Admin',
    orders: 'Orders',
    orderReady: 'Your order is saved.',
    openWhatsapp: 'Open WhatsApp',
    orderNumber: 'Order',
    missingOrder: 'This browser does not have an order to show.',
    saveProduct: 'Save product',
    productSaved: 'The product is saved.',
    productInvalid: 'The product was not saved. Check the title, the description, and the price.',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    removeImage: 'Remove image',
    uploadImage: 'Upload image',
    replaceImage: 'Replace image',
    noImage: 'No image yet',
    imagePlaceholder: 'Upload a photo and crop it to the same 4:5 frame used in the shop.',
    imageInvalid: 'Choose a JPEG, PNG, or WebP image up to 5 MB.',
    productImage: 'Product image',
    imageRatio: '4:5 shop frame',
    cropImage: 'Crop product image',
    cropHelp: 'Move and zoom the photo until the shirt sits cleanly inside the frame.',
    zoom: 'Zoom',
    cancel: 'Cancel',
    useImage: 'Use this photo',
    croppingImage: 'Preparing photo…',
    productDetails: 'Product details',
    detailsHelp: 'Name, description, price, and availability.',
    editorIntro: 'Keep the product photo, details, and stock together in one clear editor.',
    boldText: 'Bold',
    italicText: 'Italic',
    markdownHelp: 'Emoji, bold, italics, and line breaks are supported.',
    preview: 'Preview',
    stockHelp: 'Enter the number available for each size. Use 0 for sold out.',
    pieces: 'pieces',
    savingProduct: 'Saving…',
    visibility: 'Shop visibility',
    visibleHelp: 'This product is visible and available in the public shop.',
    hiddenHelp: 'This product is hidden from customers but remains available here.',
    showProduct: 'Show product in shop',
    hideProduct: 'Hide product from shop',
    visibleProduct: 'Visible',
    hiddenProduct: 'Hidden',
    deleteProduct: 'Delete product',
    deleteWarning: 'Delete “{name}”? This removes its stock and image permanently. This action cannot be undone.',
    confirmDelete: 'Yes, delete product',
    deletingProduct: 'Deleting…',
    deleteFailed: 'The product could not be deleted. Try again.',
    reviewChanges: 'Final review',
    checkProduct: 'Check before saving',
    reviewHelp: 'Confirm the photo, details, stock, and visibility.',
    editChanges: 'Back to edit',
    saveChanges: 'Save changes',
    productCreated: 'Product created',
    productUpdated: 'Changes saved',
    createdNext: 'The product is ready. Add another one or see it in the shop.',
    updatedNext: 'The latest product details are saved.',
    addAnotherProduct: 'Add another product',
    continueEditing: 'Continue editing',
    goToShop: 'Go to shop',
    productsLabel: 'Products',
    noProducts: 'No products yet.',
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
    admin: 'Admin',
    orders: 'Pedidos',
    orderReady: 'O pedido foi gravado.',
    openWhatsapp: 'Abrir WhatsApp',
    orderNumber: 'Pedido',
    missingOrder: 'Este navegador não tem um pedido para mostrar.',
    saveProduct: 'Salvar produto',
    productSaved: 'O produto foi salvo.',
    productInvalid: 'O produto não foi salvo. Confira o título, a descrição e o preço.',
    titleLabel: 'Título',
    descriptionLabel: 'Descrição',
    removeImage: 'Remover imagem',
    uploadImage: 'Enviar imagem',
    replaceImage: 'Trocar imagem',
    noImage: 'Ainda sem imagem',
    imagePlaceholder: 'Envie uma foto e recorte no mesmo formato 4:5 usado na loja.',
    imageInvalid: 'Escolha uma imagem JPEG, PNG ou WebP de até 5 MB.',
    productImage: 'Imagem do produto',
    imageRatio: 'Formato 4:5 da loja',
    cropImage: 'Recortar imagem do produto',
    cropHelp: 'Mova e amplie a foto até que a camiseta fique bem enquadrada.',
    zoom: 'Zoom',
    cancel: 'Cancelar',
    useImage: 'Usar esta foto',
    croppingImage: 'Preparando foto…',
    productDetails: 'Detalhes do produto',
    detailsHelp: 'Nome, descrição, preço e disponibilidade.',
    editorIntro: 'Mantenha a foto, os detalhes e o estoque do produto em um único editor.',
    boldText: 'Negrito',
    italicText: 'Itálico',
    markdownHelp: 'Aceita emoji, negrito, itálico e quebras de linha.',
    preview: 'Prévia',
    stockHelp: 'Informe a quantidade disponível por tamanho. Use 0 para esgotado.',
    pieces: 'peças',
    savingProduct: 'Salvando…',
    visibility: 'Visibilidade na loja',
    visibleHelp: 'Este produto está visível e disponível na loja pública.',
    hiddenHelp: 'Este produto está oculto para clientes, mas continua disponível aqui.',
    showProduct: 'Mostrar produto na loja',
    hideProduct: 'Ocultar produto da loja',
    visibleProduct: 'Visível',
    hiddenProduct: 'Oculto',
    deleteProduct: 'Excluir produto',
    deleteWarning: 'Excluir “{name}”? Isso remove permanentemente o estoque e a imagem. Esta ação não pode ser desfeita.',
    confirmDelete: 'Sim, excluir produto',
    deletingProduct: 'Excluindo…',
    deleteFailed: 'Não foi possível excluir o produto. Tente novamente.',
    reviewChanges: 'Revisão final',
    checkProduct: 'Confira antes de salvar',
    reviewHelp: 'Confirme a foto, os detalhes, o estoque e a visibilidade.',
    editChanges: 'Voltar para editar',
    saveChanges: 'Salvar alterações',
    productCreated: 'Produto criado',
    productUpdated: 'Alterações salvas',
    createdNext: 'O produto está pronto. Adicione outro ou veja na loja.',
    updatedNext: 'Os dados mais recentes do produto foram salvos.',
    addAnotherProduct: 'Adicionar outro produto',
    continueEditing: 'Continuar editando',
    goToShop: 'Ir para a loja',
    productsLabel: 'Produtos',
    noProducts: 'Ainda não há produtos.',
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
