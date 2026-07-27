import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'نسيت كلمة المرور',
  alternates: { canonical: '/forgot-password' },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
