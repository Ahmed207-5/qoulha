import type { Metadata } from 'next';
import { Cairo, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Providers } from '@/providers/providers';
import { Toaster } from 'sonner';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'قولها — قول اللي جوّاك من غير ما حد يعرف مين انت',
    template: '%s — قولها',
  },
  description:
    'قولها هي منصة الرسائل المجهولة العربية. اعمل صفحتك الشخصية، شارك رابطك، واستقبل رسائل صادقة من غير ما حد يعرف مين بعتها.',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: 'قولها',
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${plexArabic.variable} font-body`}>
        <Providers>
          {children}
          <Toaster position="top-center" richColors dir="rtl" />
        </Providers>
      </body>
    </html>
  );
}
