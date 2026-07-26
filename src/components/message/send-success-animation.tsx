'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SendSuccessAnimation({ onSendAnother }: { onSendAnother: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
      >
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      </motion.div>
      <h3 className="mt-5 font-display text-xl font-bold text-brand-950 dark:text-white">وصلت رسالتك</h3>
      <p className="mt-1.5 text-sm text-brand-700/80 dark:text-brand-200/80">
        رسالتك وصلت من غير ما يعرف حد إنك انت اللي بعتها.
      </p>
      <Button variant="secondary" className="mt-6" onClick={onSendAnother}>
        ابعت رسالة تانية
      </Button>
    </motion.div>
  );
}
