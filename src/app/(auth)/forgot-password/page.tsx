'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { forgotPasswordAction } from '@/actions/auth';
import { AuthCard } from '@/components/auth/auth-card';
import { Input, FieldError } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    await forgotPasswordAction(data);
    setSent(true); // always show success — no account enumeration
  }

  return (
    <AuthCard title="نسيت كلمة المرور؟" subtitle="هنبعتلك رابط لإعادة تعيينها">
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <MailCheck className="mb-4 h-12 w-12 text-brand-500" />
          <p className="text-sm text-brand-700/80 dark:text-brand-200/80">
            لو البريد ده مسجل عندنا، هيوصلك رابط إعادة التعيين دلوقتي.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Input type="email" placeholder="البريد الإلكتروني" autoComplete="email" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            إرسال رابط إعادة التعيين
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
