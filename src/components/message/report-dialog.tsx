'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportMessageAction } from '@/actions/message-mutations';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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

export function ReportDialog({ messageId, onClose }: { messageId: string; onClose: () => void }) {
  const [reason, setReason] = React.useState<ReportReason>('harassment');
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const result = await reportMessageAction({ messageId, reason });
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ');
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
            <h3 className="font-display font-bold text-brand-950 dark:text-white">الإبلاغ عن رسالة</h3>
            <button onClick={onClose}><X className="h-5 w-5 text-brand-500" /></button>
          </div>

          <div className="space-y-2">
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

          <Button className="mt-5 w-full" variant="destructive" onClick={handleSubmit} isLoading={submitting}>
            إرسال البلاغ
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
