import type { Metadata } from 'next';
import { Cairo, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Providers } from '@/providers/providers';
import { Toaster } from 'sonner';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { GoogleAnalyticsPageView } from '@/components/analytics/google-analytics-pageview';
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const siteName = 'قولها';
const siteDescription =
  'قولها هي منصة الرسائل المجهولة العربية. اعمل صفحتك الشخصية، شارك رابطك، واستقبل رسائل صادقة من غير ما حد يعرف مين بعتها.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'قولها — قول اللي جوّاك من غير ما حد يعرف مين انت',
    template: '%s — قولها',
  },
  description: siteDescription,
  keywords: [
    'رسائل مجهولة',
    'اسأل بدون اسم',
    'قولها',
    'رسائل مجهولة الهوية',
    'anonymous messages',
    'NGL عربي',
  ],
  authors: [{ name: 'قولها' }],
  creator: 'قولها',
  publisher: 'قولها',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
 openGraph: {
  title: "قولها — قول اللي جواك من غير ما حد يعرف مين أنت",
 description:
  "قول اللي جواك من غير ما حد يعرف مين أنت. استقبل رسائل مجهولة ورد عليها وشاركها مع الجميع بأمان.",
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Qoulha",
    },
  ],
},
  twitter: {
  card: "summary_large_image",
  title: "قولها",
  description:
  "قول اللي جواك من غير ما حد يعرف مين أنت. استقبل رسائل مجهولة ورد عليها وشاركها مع الجميع بأمان.",
  images: ["/og-image.png"],
},
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
        <GoogleAnalytics />
        <GoogleAnalyticsPageView />
      </body>
    </html>
  );
}
