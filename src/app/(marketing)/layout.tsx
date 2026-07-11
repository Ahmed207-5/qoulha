import { Navbar } from '@/components/landing/navbar';
import { FloatingBackground } from '@/components/landing/floating-background';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FloatingBackground />
      <Navbar />
      <main>{children}</main>
    </>
  );
}
