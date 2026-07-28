import Link from 'next/link';
import { MessageCircleHeart } from 'lucide-react';
import { SOCIAL_LINKS } from '@/constants/social-links';
import { LinkedinIcon } from '@/components/shared/brand-icons';

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

        <div className="flex items-center gap-1">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              aria-label={link.label}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brand-500/70 transition-colors hover:bg-brand-500/10 hover:text-brand-500"
            >
              <link.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center gap-2 border-t border-brand-200/30 pt-6 text-center dark:border-white/10">
        <p className="text-xs text-brand-500/70">© {new Date().getFullYear()} قولها. جميع الحقوق محفوظة.</p>
        <p className="text-xs text-brand-500/60">
          تم تطوير وتصميم المنصة بواسطة{' '}
          <a
            href="https://www.linkedin.com/in/ahmed-elsaeed207"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-brand-500 hover:underline"
          >
            أحمد السعيد
            <LinkedinIcon className="h-3.5 w-3.5" />
          </a>
        </p>
      </div>
    </footer>
  );
}
