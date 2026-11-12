const shopPayNumber = '4917648996011';

export function shopPayUrl(message: string): string {
  return `https://wa.me/${shopPayNumber}?text=${encodeURIComponent(message)}`;
}
