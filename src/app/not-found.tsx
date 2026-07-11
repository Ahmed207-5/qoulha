import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FloatingBackground } from '@/components/landing/floating-background';
import { MessageCircleHeart } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <FloatingBackground />
      <MessageCircleHeart className="mb-4 h-14 w-14 text-brand-400" />
      <h1 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white">مالقيناش الصفحة دي</h1>
      <p className="mt-2 text-brand-700/80 dark:text-brand-200/80">يمكن الرابط غلط أو الصفحة اتشالت</p>
      <Link href="/" className="mt-6">
        <Button>ارجع للرئيسية</Button>
      </Link>
    </div>
  );
}
