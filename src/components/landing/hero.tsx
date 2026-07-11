'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';

const SAMPLE_MESSAGES = [
  { text: 'من زمان عايز أقولك إنك أكتر شخص أثّر فيا... بس دايمًا بخاف أبان.', category: 'اعتراف' },
  { text: 'شكرًا إنك كنت جنبي في أصعب وقت، حتى لو مقلتش ده قبل كده.', category: 'امتنان' },
  { text: 'رأيي إن قرارك الأخير كان صح، بس محدش قالك كده.', category: 'رأي' },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-32 pb-20">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-300/50 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
            <Lock className="h-3.5 w-3.5" />
            هويتك محمية بضمان تقني، مش مجرد وعد
          </span>

          <h1 className="font-display text-4xl font-extrabold leading-[1.15] text-brand-950 dark:text-white sm:text-5xl lg:text-6xl">
            في حاجات بنعرف
            <br />
            <span className="gradient-text">نكتبها</span>... ومبنعرفش
            <br />
            نقولها.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-brand-700/90 dark:text-brand-200/90">
            اعمل صفحتك الشخصية على قولها، شارك رابطك، واستقبل رسائل حقيقية
            وصادقة من غير ما حد يعرف مين اللي بعتها.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/register">
              <Button size="lg">
                اعمل صفحتك دلوقتي
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/wall">
              <Button size="lg" variant="secondary">شوف الحائط العام</Button>
            </Link>
          </div>
        </motion.div>

        {/* Signature element: messages arrive whole, the sender tag stays permanently redacted */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="glass-strong rounded-4xl p-5 space-y-4">
            {SAMPLE_MESSAGES.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.25, duration: 0.5 }}
                className="glass rounded-3xl p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
                    {msg.category}
                  </span>
                  {/* permanently redacted sender bar — the visual thesis of the product */}
                  <span className="h-3 w-16 rounded-full bg-brand-950/20 dark:bg-white/10 blur-[3px] select-none" />
                </div>
                <p className="text-sm leading-relaxed text-brand-900 dark:text-brand-50">{msg.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
