'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingSchema, type OnboardingInput } from '@/lib/validations/auth';
import { updateProfileAction } from '@/actions/settings';
import { Input, Textarea, FieldError } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { AvatarUploader } from './avatar-uploader';
import { toast } from 'sonner';
import type { Profile } from '@/types/domain';

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile.full_name,
      username: profile.username,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
    },
  });

  async function onSubmit(data: OnboardingInput) {
    const result = await updateProfileAction(data);
    if (!result.success) {
      toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'حدث خطأ');
      return;
    }
    toast.success('تم حفظ التغييرات');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <AvatarUploader userId={profile.id} initialAvatarUrl={profile.avatar_url} />
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">الاسم الكامل</label>
        <Input {...register('fullName')} />
        <FieldError message={errors.fullName?.message} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">اسم المستخدم</label>
        <Input dir="ltr" {...register('username')} />
        <FieldError message={errors.username?.message} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">النبذة</label>
        <Textarea rows={3} {...register('bio')} />
        <FieldError message={errors.bio?.message} />
      </div>
      <Button type="submit" isLoading={isSubmitting}>حفظ التغييرات</Button>
    </form>
  );
}
