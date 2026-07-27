import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Privacy } from '@/components/landing/privacy';
import { FAQ } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';
import { WebsiteJsonLd } from '@/components/shared/website-json-ld';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // No title override here — the root layout's default title is written
  // specifically for the homepage already ("قولها — قول اللي جوّاك...").
  // A page-level title here would just repeat it through the "%s — قولها"
  // template and produce a duplicated brand name.
  alternates: { canonical: '/' },
  keywords: [
    'رسائل مجهولة',
    'اسأل بدون اسم',
    'قولها',
    'صفحة شخصية رسائل مجهولة',
    'anonymous messages Arabic',
  ],
};

export default function LandingPage() {
  return (
    <>
      <WebsiteJsonLd />
      <Hero />
      <Features />
      <HowItWorks />
      <Privacy />
      <FAQ />
      <Footer />
    </>
  );
}
