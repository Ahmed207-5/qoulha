'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingSchema, type OnboardingInput } from '@/lib/validations/auth';
import { completeOnboardingAction, checkUsernameAvailable, suggestUsernameAlternatives, uploadAvatarAction } from '@/actions/onboarding';
import { Input, Textarea, FieldError } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

export function OnboardingForm() {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [usernameStatus, setUsernameStatus] = React.useState<UsernameStatus>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({ resolver: zodResolver(onboardingSchema), defaultValues: { bio: '' } });

  const username = watch('username');
  const debouncedUsername = useDebouncedValue(username, 400);

  React.useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus('idle');
      setUsernameSuggestions([]);
      return;
    }
    let cancelled = false;
    setUsernameStatus('checking');
    checkUsernameAvailable(debouncedUsername).then(async (available) => {
      if (cancelled) return;
      setUsernameStatus(available ? 'available' : 'taken');
      if (!available) {
        const suggestions = await suggestUsernameAlternatives(debouncedUsername);
        if (!cancelled) setUsernameSuggestions(suggestions);
      } else {
        setUsernameSuggestions([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedUsername]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    const result = await uploadAvatarAction(file);
    setUploading(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    setAvatarUrl(result.url);
    setValue('avatarUrl', result.url);
  }

  async function onSubmit(data: OnboardingInput) {
    if (usernameStatus === 'taken') {
      toast.error('اسم المستخدم متحجز، جرّب واحد تاني');
      return;
    }
    const result = await completeOnboardingAction({ ...data, avatarUrl });
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ غير متوقع');
      return;
    }
    toast.success('صفحتك جاهزة!');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex flex-col items-center">
        <label className="group relative cursor-pointer">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-brand-300 bg-brand-500/10 flex items-center justify-center">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="" width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <Upload className="h-6 w-6 text-brand-400" />
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
        </label>
        <span className="mt-2 text-xs text-brand-500/70">اختياري — تقدر تضيفها بعدين</span>
      </div>

      <div>
        <Input placeholder="الاسم الكامل" {...register('fullName')} />
        <FieldError message={errors.fullName?.message} />
      </div>

      <div>
        <div className="relative">
          <Input placeholder="اسم المستخدم (بالإنجليزي)" dir="ltr" className="pl-10" {...register('username')} />
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-brand-400" />}
            {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
            {usernameStatus === 'taken' && <X className="h-4 w-4 text-red-500" />}
          </span>
        </div>
        {username?.length >= 3 && (
          <p className="mt-1 text-xs text-brand-500/70" dir="ltr">
            qoulha.app/u/{username}
          </p>
        )}
        {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-brand-500/70">جرّب:</span>
            {usernameSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue('username', s, { shouldValidate: true, shouldDirty: true })}
                className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-600 hover:bg-brand-500/20 dark:text-brand-300"
                dir="ltr"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <FieldError message={errors.username?.message} />
      </div>

      <div>
        <Textarea placeholder="نبذة قصيرة عنك (اختياري)" rows={3} {...register('bio')} />
        <FieldError message={errors.bio?.message} />
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={usernameStatus === 'checking' || usernameStatus === 'taken'}
      >
        كمّل لصفحتي
      </Button>
    </form>
  );
}
