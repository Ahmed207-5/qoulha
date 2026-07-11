import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'تسجيل الدخول' };

export default function LoginPage() {
  return (
    <AuthCard title="تسجيل الدخول" subtitle="أهلاً بيك تاني في قولها">
      <GoogleSignInButton />
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-200/50 dark:bg-white/10" />
        <span className="text-xs text-brand-500/70">أو</span>
        <div className="h-px flex-1 bg-brand-200/50 dark:bg-white/10" />
      </div>
      <Suspense fallback={<div className="h-48" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-brand-700/80 dark:text-brand-200/80">
        مالكش حساب؟{' '}
        <Link href="/register" className="font-semibold text-brand-500 hover:underline">
          اعمل واحد دلوقتي
        </Link>
      </p>
    </AuthCard>
  );
}
