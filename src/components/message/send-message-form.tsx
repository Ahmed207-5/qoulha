'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendMessageSchema, type SendMessageInput, MESSAGE_MAX_LENGTH } from '@/lib/validations/message';
import { sendMessageAction } from '@/actions/messages';
import { Textarea, FieldError } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { CategorySelect } from './category-select';
import { MoodSelect } from './mood-select';
import { TagPicker } from './tag-picker';
import { TurnstileWidget } from './turnstile-widget';
import { SendSuccessAnimation } from './send-success-animation';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ANONYMITY_NOTICE } from '@/constants/message';

export function SendMessageForm({ recipientId }: { recipientId: string }) {
  const [sent, setSent] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendMessageInput>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { recipientId, category: 'general', mood: 'calm', content: '', captchaToken: '', tags: [] },
  });

  const content = watch('content');
  const remaining = MESSAGE_MAX_LENGTH - (content?.length ?? 0);

  async function onSubmit(data: SendMessageInput) {
    const result = await sendMessageAction(data);
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ غير متوقع');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <SendSuccessAnimation
        onSendAnother={() => {
          reset({ recipientId, category: 'general', mood: 'calm', content: '', captchaToken: '', tags: [] });
          setSent(false);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <p className="mb-2 text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">اختار تصنيف الرسالة</p>
        <Controller
          control={control}
          name="category"
          render={({ field }) => <CategorySelect value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">إيه اللي حاسس بيه؟</p>
        <Controller
          control={control}
          name="mood"
          render={({ field }) => <MoodSelect value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">
          تاجات (اختياري، لحد 3)
        </p>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => <TagPicker value={field.value ?? []} onChange={field.onChange} />}
        />
      </div>

      <div>
        <Textarea
          rows={6}
          placeholder="اكتب اللي في قلبك..."
          maxLength={MESSAGE_MAX_LENGTH}
          {...register('content')}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <FieldError message={errors.content?.message} />
          <span
            className={cn(
              'text-xs',
              remaining < 30 ? 'font-semibold text-orange-500' : 'text-brand-500/60'
            )}
          >
            {remaining} حرف متبقي
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-brand-500/5 p-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <p className="text-xs leading-relaxed text-brand-700/80 dark:text-brand-200/80">{ANONYMITY_NOTICE}</p>
      </div>

      <Controller
        control={control}
        name="captchaToken"
        render={({ field }) => <TurnstileWidget onVerify={field.onChange} />}
      />
      <FieldError message={errors.captchaToken?.message} />

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        ابعت الرسالة
      </Button>
    </form>
  );
}
