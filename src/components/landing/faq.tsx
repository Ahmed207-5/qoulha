'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  { q: 'هل ينفع أعرف مين بعت الرسالة؟', a: 'لأ، مفيش أي طريقة قانونية أو تقنية متاحة للمستخدم العادي تكشف هوية المرسل. البيانات دي محمية على مستوى قاعدة البيانات.' },
  { q: 'هل قولها بتحذف السبام والرسائل المسيئة؟', a: 'أيوه، في فلترة تلقائية للألفاظ المسيئة قبل الإرسال، وممكن كمان تبلغ عن أي رسالة تتراجع من فريق الإشراف.' },
  { q: 'هل ينفع أمنع استقبال رسائل مؤقتًا؟', a: 'أيوه، من صفحة الإعدادات تقدر توقف استقبال الرسائل الجديدة في أي وقت.' },
  { q: 'إيه اللي بيحصل للرسائل اللي بنشرها على الحائط العام؟', a: 'بتفضل من غير أي معلومة عن هوية صاحبها الأصلي، وبيقدر أي زائر يتفاعل معاها بالإيموجي.' },
];

export function FAQ() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-12 text-center font-display text-3xl font-extrabold text-brand-950 dark:text-white sm:text-4xl">
          أسئلة شائعة
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="glass overflow-hidden rounded-2xl">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-right"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-brand-950 dark:text-white">{faq.q}</span>
                <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform', open === i && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-6 pb-4 text-sm leading-relaxed text-brand-700/80 dark:text-brand-200/80">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
