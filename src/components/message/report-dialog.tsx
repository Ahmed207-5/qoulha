'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportMessageAction } from '@/actions/message-mutations';
import { Button } from '@/components/ui/button';
import { Textarea, FieldError } from '@/components/ui/form-elements';
import { X, Flag } from 'lucide-react';
import { toast } from 'sonner';
import type { ReportReason } from '@/types/domain';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'تحرش أو مضايقة' },
  { value: 'spam', label: 'سبام' },
  { value: 'hate_speech', label: 'خطاب كراهية' },
  { value: 'sexual_content', label: 'محتوى جنسي' },
  { value: 'threat', label: 'تهديد' },
  { value: 'other', label: 'سبب تاني' },
];

const MIN_DETAILS_LENGTH = 10;
const MAX_DETAILS_LENGTH = 500;

export function ReportDialog({ messageId, onClose }: { messageId: string; onClose: () => void }) {
  const [reason, setReason] = React.useState<ReportReason>('harassment');
  const [details, setDetails] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit() {
    setFieldErrors({});

    // Client-side check first so a clearly-invalid submission never even
    // hits the network — the server still validates independently via the
    // exact same schema (reportMessageSchema), so this is purely for fast
    // feedback, not the actual enforcement.
    if (details.trim().length < MIN_DETAILS_LENGTH) {
      setFieldErrors({ details: `اكتب تفاصيل أكتر (${MIN_DETAILS_LENGTH} أحرف على الأقل)` });
      return;
    }

    setSubmitting(true);
    const result = await reportMessageAction({ messageId, reason, details });
    setSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'حدث خطأ أثناء إرسال البلاغ');
      return;
    }
    toast.success('تم إرسال البلاغ، شكرًا لك');
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong w-full max-w-sm rounded-3xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display font-bold text-brand-950 dark:text-white">
              <Flag className="h-4 w-4 text-red-500" />
              الإبلاغ عن رسالة
            </h3>
            <button onClick={onClose} aria-label="إغلاق">
              <X className="h-5 w-5 text-brand-500" />
            </button>
          </div>

          <p className="mb-1 text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">السبب</p>
          <div className="space-y-1">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-brand-500/5">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-brand-500"
                />
                <span className="text-sm text-brand-900 dark:text-brand-50">{r.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3">
            <label htmlFor="report-details" className="mb-1 block text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">
              التفاصيل <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="report-details"
              rows={3}
              maxLength={MAX_DETAILS_LENGTH}
              placeholder="اشرح المشكلة بالتفصيل عشان فريق الإشراف يقدر يتصرف بسرعة"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              aria-invalid={!!fieldErrors.details}
              aria-describedby={fieldErrors.details ? 'report-details-error' : undefined}
            />
            <div className="mt-1 flex items-center justify-between">
              <FieldError message={fieldErrors.details} />
              <span className="text-[11px] text-brand-500/60">{details.length}/{MAX_DETAILS_LENGTH}</span>
            </div>
          </div>

          <Button className="mt-4 w-full" variant="destructive" onClick={handleSubmit} isLoading={submitting}>
            إرسال البلاغ
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
