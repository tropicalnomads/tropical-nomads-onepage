import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceDir = join(dirname(fileURLToPath(import.meta.url)), '../src');

function source(name: string): string {
  return readFileSync(join(sourceDir, name), 'utf8');
}

test('pages that render for every visitor do not load the S3 client while the module evaluates', () => {
  const modules = ['app.ts', 'private-api.ts', 'parties.ts', 'artists.ts', 'catalog.ts', 'accounts.ts', 's3-load.ts'];
  for (const name of modules) {
    const text = source(name);
    assert.equal(text.includes("from './catalog-images.ts'"), false, name);
    assert.equal(text.includes("from './shop-products.ts'"), false, name);
    assert.equal(text.includes("from './object-store.ts'"), false, name);
    assert.equal(text.includes("from '@aws-sdk/client-s3'"), false, name);
  }
  const loader = source('s3-load.ts');
  assert.equal(loader.includes("import('./catalog-images.ts')"), true);
  assert.equal(loader.includes("import('./shop-products.ts')"), true);
});
