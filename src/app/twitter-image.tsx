import { renderOgImage, OG_IMAGE_SIZE } from '@/lib/og-image';

export const runtime = 'edge';
export const alt = 'قولها — قول اللي جوّاك من غير ما حد يعرف مين انت';
export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOgImage();
}
