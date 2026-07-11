import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'تأكيد البريد الإلكتروني' };

export default function VerifyEmailPage() {
  return (
    <AuthCard title="تم تأكيد بريدك الإلكتروني" subtitle="حسابك جاهز، خطوة وحدة كمان">
      <div className="flex flex-col items-center py-4 text-center">
        <MailCheck className="mb-4 h-12 w-12 text-brand-500" />
        <p className="text-sm text-brand-700/80 dark:text-brand-200/80">
          دلوقتي محتاج نعرف اسمك واسم المستخدم عشان نجهزلك صفحتك الشخصية.
        </p>
        <Link href="/onboarding" className="mt-6 w-full">
          <Button className="w-full">كمّل إعداد صفحتك</Button>
        </Link>
      </div>
    </AuthCard>
  );
}
