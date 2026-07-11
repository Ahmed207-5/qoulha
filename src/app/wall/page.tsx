import { WallGrid } from '@/components/wall/wall-grid';
import { Navbar } from '@/components/landing/navbar';
import { FloatingBackground } from '@/components/landing/floating-background';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الحائط العام',
  description: 'رسائل حقيقية اختار أصحابها ينشروها على قولها',
};

export default function WallPage() {
  return (
    <>
      <FloatingBackground />
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white">الحائط العام</h1>
          <p className="mt-2 text-brand-700/80 dark:text-brand-200/80">رسائل حقيقية اختار أصحابها ينشروها</p>
        </div>
        <WallGrid />
      </div>
    </>
  );
}
