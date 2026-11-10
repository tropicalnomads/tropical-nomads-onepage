import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { databaseSettings, databaseTls } from './database.ts';
import { assetsBucketName, putShopImage, shopImageType, shopObjectKey } from './object-store.ts';

const localEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (existsSync(localEnv)) {
  process.loadEnvFile(localEnv);
}

const shopDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../one-pager/public/shop');

function diskImage(image: string): Uint8Array | undefined {
  if (!image.startsWith('/shop/') || image.startsWith('/shop/media/')) {
    return undefined;
  }
  const file = image.slice('/shop/'.length);
  if (file !== basename(file) || file.startsWith('.')) {
    return undefined;
  }
  const path = resolve(shopDir, file);
  if (!path.startsWith(`${shopDir}${sep}`)) {
    return undefined;
  }
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > 5_000_000) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return new Uint8Array(readFileSync(path));
}

async function copyShopImages(): Promise<void> {
  const settings = databaseSettings();
  if (!settings || !assetsBucketName()) {
    throw new Error('shop images were not copied');
  }
  const client = new pg.Client({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    ssl: databaseTls(),
  });
  await client.connect();
  try {
    const products = await client.query<{ id: string; image: string }>('select id, image from product order by id');
    const stored = await client.query<{ product_id: string; bytes: Buffer }>('select product_id, bytes from product_image');
    const storedBytes = new Map(stored.rows.map((row) => [row.product_id, row.bytes]));
    for (const product of products.rows) {
      if (!shopObjectKey(product.id)) {
        throw new Error('shop images were not copied');
      }
      if (product.image.trim() === '') {
        process.stdout.write(`skipped ${product.id}\n`);
        continue;
      }
      const fromTable = storedBytes.get(product.id);
      const bytes = Buffer.isBuffer(fromTable) ? new Uint8Array(fromTable) : diskImage(product.image);
      const media = `/shop/media/${product.id}`;
      if (!bytes) {
        if (product.image === media) {
          process.stdout.write(`kept ${product.id}\n`);
          continue;
        }
        throw new Error('shop images were not copied');
      }
      if (!shopImageType(bytes)) {
        throw new Error('shop images were not copied');
      }
      await putShopImage(product.id, bytes);
      const updated = await client.query(
        `update product
         set image = $2,
             document = jsonb_set(document, '{image}', to_jsonb($2::text), true)
         where id = $1`,
        [product.id, media],
      );
      if (updated.rowCount !== 1) {
        throw new Error('shop images were not copied');
      }
      process.stdout.write(`copied ${product.id}\n`);
    }
  } finally {
    await client.end();
  }
}

copyShopImages().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'shop images were not copied';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
