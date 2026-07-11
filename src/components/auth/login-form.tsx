'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { loginAction } from '@/actions/auth';
import { Input, FieldError } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    const result = await loginAction(data);
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ غير متوقع');
      return;
    }
    router.push(searchParams.get('redirectTo') ?? '/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Input type="email" placeholder="البريد الإلكتروني" autoComplete="email" {...register('email')} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <Input type="password" placeholder="كلمة المرور" autoComplete="current-password" {...register('password')} />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="flex justify-end">
        <a href="/forgot-password" className="text-xs font-medium text-brand-500 hover:underline">
          نسيت كلمة المرور؟
        </a>
      </div>
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        تسجيل الدخول
      </Button>
    </form>
  );
}
