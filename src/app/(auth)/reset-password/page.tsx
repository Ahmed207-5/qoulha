'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth';
import { resetPasswordAction } from '@/actions/auth';
import { AuthCard } from '@/components/auth/auth-card';
import { Input, FieldError } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(data: ResetPasswordInput) {
    const result = await resetPasswordAction(data);
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ غير متوقع');
      return;
    }
    toast.success('تم تغيير كلمة المرور بنجاح');
    router.push('/login');
  }

  return (
    <AuthCard title="كلمة مرور جديدة" subtitle="اختار كلمة مرور قوية لحسابك">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Input type="password" placeholder="كلمة المرور الجديدة" autoComplete="new-password" {...register('password')} />
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
          حفظ كلمة المرور
        </Button>
      </form>
    </AuthCard>
  );
}
