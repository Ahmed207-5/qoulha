import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'إعادة تعيين كلمة المرور',
  // Only ever reached via a one-time emailed token link — nothing useful
  // for search engines to index here.
  robots: { index: false, follow: true },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
