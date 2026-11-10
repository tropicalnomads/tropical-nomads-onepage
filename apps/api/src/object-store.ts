import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const imageLimit = 5_000_000;
const productIdPattern = /^[A-Za-z0-9_-]{1,40}$/;
const bucketPattern = /^tropical-nomads-assets-[0-9]{12}$/;

export type ShopImageType = 'image/jpeg' | 'image/png' | 'image/webp';

let client: S3Client | undefined;

function s3(): S3Client {
  client ??= new S3Client({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-central-1',
  });
  return client;
}

export function assetsBucketName(): string | undefined {
  const name = process.env.ASSETS_BUCKET?.trim() ?? '';
  if (name === '') {
    return undefined;
  }
  if (!bucketPattern.test(name)) {
    throw new Error('image was not stored');
  }
  return name;
}

export function shopObjectKey(productId: string): string | undefined {
  if (!productIdPattern.test(productId)) {
    return undefined;
  }
  return `shop/${productId}`;
}

export function shopImageType(bytes: Uint8Array): ShopImageType | undefined {
  if (bytes.length < 12 || bytes.length > imageLimit) {
    return undefined;
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return undefined;
}

function isMissingObject(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if ('name' in error && (error.name === 'NoSuchKey' || error.name === 'NotFound')) {
    return true;
  }
  if (!('$metadata' in error) || typeof error.$metadata !== 'object' || error.$metadata === null || !('httpStatusCode' in error.$metadata)) {
    return false;
  }
  return error.$metadata.httpStatusCode === 404;
}

export async function putShopImage(productId: string, bytes: Uint8Array): Promise<void> {
  const bucket = assetsBucketName();
  const key = shopObjectKey(productId);
  const contentType = shopImageType(bytes);
  if (!bucket || !key || !contentType) {
    throw new Error('image was not stored');
  }
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );
}

export async function readShopImage(productId: string): Promise<{ contentType: ShopImageType; bytes: Uint8Array } | undefined> {
  const bucket = assetsBucketName();
  const key = shopObjectKey(productId);
  if (!bucket || !key) {
    return undefined;
  }
  try {
    const response = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (typeof response.ContentLength === 'number' && response.ContentLength > imageLimit) {
      return undefined;
    }
    const payload = response.Body;
    if (!payload) {
      return undefined;
    }
    const bytes = new Uint8Array(await payload.transformToByteArray());
    const contentType = shopImageType(bytes);
    if (!contentType) {
      return undefined;
    }
    return { contentType, bytes };
  } catch (error) {
    if (isMissingObject(error)) {
      return undefined;
    }
    throw error;
  }
}

export async function deleteShopImage(productId: string): Promise<void> {
  const bucket = assetsBucketName();
  const key = shopObjectKey(productId);
  if (!bucket || !key) {
    return;
  }
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
