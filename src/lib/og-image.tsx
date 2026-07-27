import { ImageResponse } from 'next/og';

// Brand purple scale from tailwind.config.ts, inlined here since ImageResponse
// renders outside the app's normal CSS/Tailwind pipeline.
const BRAND_950 = '#140d21';
const BRAND_600 = '#553a8a';
const BRAND_100 = '#e8e1f6';

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * Renders the default site-wide social share image. Deliberately simple —
 * a brand-colored gradient with the site name — so it degrades gracefully
 * under Satori's Arabic text-shaping constraints instead of risking
 * garbled glyphs from a more elaborate layout. `dir="rtl"` is set
 * explicitly since ImageResponse doesn't inherit page direction.
 */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `linear-gradient(135deg, ${BRAND_950} 0%, ${BRAND_600} 100%)`,
        }}
      >
        <div
          dir="rtl"
          style={{
            display: 'flex',
            fontSize: 120,
            fontWeight: 800,
            color: '#ffffff',
          }}
        >
          قولها
        </div>
        <div
          dir="rtl"
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 36,
            color: BRAND_100,
          }}
        >
          قول اللي جوّاك من غير ما حد يعرف مين انت
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
