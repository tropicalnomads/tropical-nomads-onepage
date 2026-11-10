import { databaseSettings } from './database.ts';
import { assetsBucketName, deleteCatalogObject, putCatalogObject, readCatalogObject, shopImageType, type ShopImageType } from './object-store.ts';
import { runInTransaction } from './sql-store.ts';

export type CatalogImageKind = 'event' | 'artist';

const idPattern = /^[A-Za-z0-9_-]{1,80}$/;

function folder(kind: CatalogImageKind): 'events' | 'artists' {
  switch (kind) {
    case 'event':
      return 'events';
    case 'artist':
      return 'artists';
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

export function decodeCatalogImage(value: string): Uint8Array {
  if (value.length > 7_000_000) {
    throw new Error('image was not stored');
  }
  const bytes = new Uint8Array(Buffer.from(value, 'base64'));
  if (!shopImageType(bytes)) {
    throw new Error('image was not stored');
  }
  return bytes;
}

export async function putCatalogImage(kind: CatalogImageKind, id: string, bytes: Uint8Array): Promise<void> {
  const contentType = shopImageType(bytes);
  if (!idPattern.test(id) || !contentType) {
    throw new Error('image was not stored');
  }
  if (assetsBucketName()) {
    await putCatalogObject(folder(kind), id, bytes);
    return;
  }
  if (!databaseSettings()) {
    throw new Error('image was not stored');
  }
  const stored = Buffer.from(bytes);
  switch (kind) {
    case 'event':
      await runInTransaction((client) =>
        client.query(
          `insert into party_image (party_id, content_type, bytes) values ($1, $2, $3)
           on conflict (party_id) do update set content_type = excluded.content_type, bytes = excluded.bytes`,
          [id, contentType, stored],
        ),
      );
      return;
    case 'artist':
      await runInTransaction((client) =>
        client.query(
          `insert into artist_image (artist_id, content_type, bytes) values ($1, $2, $3)
           on conflict (artist_id) do update set content_type = excluded.content_type, bytes = excluded.bytes`,
          [id, contentType, stored],
        ),
      );
      return;
    default: {
      const unexpected: never = kind;
      throw new Error(unexpected);
    }
  }
}

export async function deleteCatalogImage(kind: CatalogImageKind, id: string): Promise<void> {
  if (!idPattern.test(id)) {
    return;
  }
  if (assetsBucketName()) {
    await deleteCatalogObject(folder(kind), id);
    return;
  }
  if (!databaseSettings()) {
    return;
  }
  switch (kind) {
    case 'event':
      await runInTransaction((client) => client.query('delete from party_image where party_id = $1', [id]));
      return;
    case 'artist':
      await runInTransaction((client) => client.query('delete from artist_image where artist_id = $1', [id]));
      return;
    default: {
      const unexpected: never = kind;
      throw new Error(unexpected);
    }
  }
}

export async function readCatalogImage(kind: CatalogImageKind, id: string): Promise<{ contentType: ShopImageType; bytes: Uint8Array } | undefined> {
  if (!idPattern.test(id)) {
    return undefined;
  }
  if (assetsBucketName()) {
    return readCatalogObject(folder(kind), id);
  }
  if (!databaseSettings()) {
    return undefined;
  }
  const rows = await runInTransaction((client) => {
    switch (kind) {
      case 'event':
        return client.query('select content_type, bytes from party_image where party_id = $1', [id]);
      case 'artist':
        return client.query('select content_type, bytes from artist_image where artist_id = $1', [id]);
      default: {
        const unexpected: never = kind;
        throw new Error(unexpected);
      }
    }
  });
  const row = rows.rows[0];
  const contentType = row?.content_type;
  const bytes = row?.bytes;
  if ((contentType !== 'image/jpeg' && contentType !== 'image/png' && contentType !== 'image/webp') || !Buffer.isBuffer(bytes)) {
    return undefined;
  }
  const payload = new Uint8Array(bytes);
  if (!shopImageType(payload)) {
    return undefined;
  }
  return { contentType, bytes: payload };
}
