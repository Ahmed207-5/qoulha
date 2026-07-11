import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Privacy } from '@/components/landing/privacy';
import { FAQ } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Privacy />
      <FAQ />
      <Footer />
    </>
  );
}
