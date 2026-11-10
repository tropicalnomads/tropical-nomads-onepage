import type { Area } from 'react-easy-crop';

const outputWidth = 1000;
const outputHeight = 1250;

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

export async function croppedShopImage(source: string, crop: Area): Promise<File> {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('image could not be cropped');
  }
  context.fillStyle = '#151231';
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputWidth, outputHeight);
  const blob = await canvasBlob(canvas);
  if (blob.size > 5_000_000) {
    throw new Error('image is too large');
  }
  return new File([blob], 'product.webp', { type: 'image/webp' });
}
