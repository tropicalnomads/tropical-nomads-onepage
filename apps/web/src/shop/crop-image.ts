import type { Area } from 'react-easy-crop';

export const shopCropSize = { width: 1000, height: 1250 } as const;
export const eventCropSize = { width: 1200, height: 1600 } as const;
export const artistCropSize = { width: 1000, height: 1000 } as const;
export const avatarCropSize = { width: 1000, height: 1000 } as const;

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image could not be loaded'));
    image.src = source;
  });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('image could not be cropped'));
      },
      'image/webp',
      0.9,
    );
  });
}

export async function croppedImage(source: string, crop: Area, size: { width: number; height: number }, fileName: string): Promise<File> {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('image could not be cropped');
  }
  context.fillStyle = '#151231';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height);
  const blob = await canvasBlob(canvas);
  if (blob.size > 5_000_000) {
    throw new Error('image is too large');
  }
  return new File([blob], fileName, { type: 'image/webp' });
}

export async function croppedShopImage(source: string, crop: Area): Promise<File> {
  return croppedImage(source, crop, shopCropSize, 'product.webp');
}
