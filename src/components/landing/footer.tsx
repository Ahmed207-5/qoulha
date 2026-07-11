import Link from 'next/link';
import { MessageCircleHeart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-brand-200/30 px-6 py-12 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <MessageCircleHeart className="h-6 w-6 text-brand-500" />
          <span className="font-display text-lg font-bold gradient-text">قولها</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-brand-700/80 dark:text-brand-200/80">
          <a href="#features" className="hover:text-brand-500">المميزات</a>
          <a href="#privacy" className="hover:text-brand-500">الخصوصية</a>
          <Link href="/wall" className="hover:text-brand-500">الحائط العام</Link>
          <Link href="/login" className="hover:text-brand-500">تسجيل الدخول</Link>
        </div>

        <p className="text-xs text-brand-500/70">© {new Date().getFullYear()} قولها. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}
