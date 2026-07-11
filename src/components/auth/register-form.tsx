'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { registerAction } from '@/actions/auth';
import { Input, FieldError } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';

export function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    const result = await registerAction(data);
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ غير متوقع');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <MailCheck className="mb-4 h-12 w-12 text-brand-500" />
        <p className="font-semibold text-brand-950 dark:text-white">تفقّد بريدك الإلكتروني</p>
        <p className="mt-1 text-sm text-brand-700/80 dark:text-brand-200/80">
          بعتنالك رابط تأكيد، افتحه عشان تكمل حسابك.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Input type="email" placeholder="البريد الإلكتروني" autoComplete="email" {...register('email')} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <Input type="password" placeholder="كلمة المرور" autoComplete="new-password" {...register('password')} />
        <FieldError message={errors.password?.message} />
      </div>
      <div>
        <Input
          type="password"
          placeholder="تأكيد كلمة المرور"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        إنشاء الحساب
      </Button>
    </form>
  );
}
