'use client';

import { motion } from 'framer-motion';
import { UserPlus, Link2, Inbox } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'اعمل حسابك', desc: 'سجّل في ثوانٍ واختار اسم مستخدم مميز لصفحتك.' },
  { icon: Link2, title: 'شارك رابطك', desc: 'انشر رابط صفحتك في البايو أو الستوري وخلي متابعينك يبعتولك.' },
  { icon: Inbox, title: 'استقبل بصدق', desc: 'هتوصلك رسائل حقيقية، تقدر تعمل بيها اللي انت عايزه.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-3xl font-extrabold text-brand-950 dark:text-white sm:text-4xl">
          ثلاث خطوات بس
        </h2>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/30">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-brand-950 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-brand-700/80 dark:text-brand-200/80">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute top-8 right-[-2.5rem] hidden h-px w-20 bg-gradient-to-l from-brand-400/60 to-transparent sm:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
