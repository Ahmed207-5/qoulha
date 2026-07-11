import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'إنشاء حساب' };

export default function RegisterPage() {
  return (
    <AuthCard title="اعمل حسابك" subtitle="خطوة واحدة تفصلك عن صفحتك الشخصية">
      <GoogleSignInButton />
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-200/50 dark:bg-white/10" />
        <span className="text-xs text-brand-500/70">أو</span>
        <div className="h-px flex-1 bg-brand-200/50 dark:bg-white/10" />
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-brand-700/80 dark:text-brand-200/80">
        عندك حساب بالفعل؟{' '}
        <Link href="/login" className="font-semibold text-brand-500 hover:underline">
          سجّل دخولك
        </Link>
      </p>
    </AuthCard>
  );
}
