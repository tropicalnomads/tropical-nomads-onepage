import { existsSync, lstatSync } from 'node:fs';
import { basename, extname, join, resolve, sep } from 'node:path';

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const maxBytes = 5_000_000;

export interface CatalogAsset {
  path: string;
  contentType: string;
}

type AssetKind = 'banners' | 'partners' | 'shop';

export function onePagerPublicDir(): string {
  const fromWeb = resolve(process.cwd(), '../one-pager/public');
  if (existsSync(fromWeb)) {
    return fromWeb;
  }
  return resolve(process.cwd(), 'apps/one-pager/public');
}

function assetDirectory(kind: AssetKind): string {
  const root = onePagerPublicDir();
  switch (kind) {
    case 'banners':
      return join(root, 'events', 'banners');
    case 'partners':
      return join(root, 'partners');
    case 'shop':
      return join(root, 'shop');
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

function knownKind(kind: string): AssetKind | undefined {
  switch (kind) {
    case 'banners':
    case 'partners':
    case 'shop':
      return kind;
    default:
      return undefined;
  }
}

export function catalogAsset(kind: string, file: string): CatalogAsset | undefined {
  const assetKind = knownKind(kind);
  if (!assetKind || file !== basename(file) || file.startsWith('.')) {
    return undefined;
  }
  const contentType = contentTypes[extname(file).toLowerCase()];
  if (!contentType) {
    return undefined;
  }
  const directory = resolve(/* turbopackIgnore: true */ assetDirectory(assetKind));
  const filePath = resolve(directory, file);
  if (!filePath.startsWith(`${directory}${sep}`)) {
    return undefined;
  }
  try {
    const stat = lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > maxBytes) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return { path: filePath, contentType };
}

export function bannerSrc(bannerLocal: string | undefined): string | undefined {
  if (!bannerLocal?.startsWith('/events/banners/')) {
    return undefined;
  }
  const file = bannerLocal.slice('/events/banners/'.length);
  if (!catalogAsset('banners', file)) {
    return undefined;
  }
  return `/catalog-assets/banners/${file}`;
}

export function shirtSrc(image: string | undefined): string | undefined {
  if (!image?.startsWith('/shop/')) {
    return undefined;
  }
  const file = image.slice('/shop/'.length);
  if (!catalogAsset('shop', file)) {
    return undefined;
  }
  return `/catalog-assets/shop/${file}`;
}

export function partnerLogoSrc(logo: string | undefined): string | undefined {
  if (!logo?.startsWith('/partners/')) {
    return undefined;
  }
  const file = logo.slice('/partners/'.length);
  if (!catalogAsset('partners', file)) {
    return undefined;
  }
  return `/catalog-assets/partners/${file}`;
}
