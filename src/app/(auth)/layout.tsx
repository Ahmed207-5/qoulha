import Link from 'next/link';
import { MessageCircleHeart } from 'lucide-react';
import { FloatingBackground } from '@/components/landing/floating-background';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <FloatingBackground />
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <MessageCircleHeart className="h-8 w-8 text-brand-500" />
          <span className="font-display text-2xl font-bold gradient-text">قولها</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
