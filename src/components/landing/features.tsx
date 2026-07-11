'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, PieChart, Palette, Share2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/form-elements';

const FEATURES = [
  { icon: ShieldCheck, title: 'خصوصية حقيقية', desc: 'هوية المُرسل محمية على مستوى قاعدة البيانات نفسها، مش بس واجهة الاستخدام.' },
  { icon: Zap, title: 'تحديث لحظي', desc: 'الرسائل الجديدة تظهر في لوحة التحكم فورًا من غير ما تحتاج تعمل تحديث للصفحة.' },
  { icon: PieChart, title: 'إحصائيات ذكية', desc: 'اعرف أكتر التصنيفات والمشاعر اللي بتوصلك، وتابع نمو صفحتك أسبوعيًا وشهريًا.' },
  { icon: Palette, title: 'تصميم يتغير معاك', desc: 'وضع ليلي ونهاري، وتجربة استخدام سلسة على الموبايل زي التطبيقات المتخصصة.' },
  { icon: Share2, title: 'حائط عام', desc: 'انشر أي رسالة عجبتك على الحائط العام، وخلي غيرك يتفاعل معاها.' },
  { icon: Sparkles, title: 'حماية من السبام', desc: 'فلترة تلقائية للألفاظ المسيئة، وتحقق أمني قبل إرسال أي رسالة.' },
];

export function Features() {
  return (
    <section id="features" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white sm:text-4xl">
            مش مجرد صندوق رسائل
          </h2>
          <p className="mt-4 text-brand-700/90 dark:text-brand-200/90">
            كل التفاصيل اللي محتاجها عشان تدير صفحتك بثقة وأمان.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full transition-transform hover:-translate-y-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-brand-950 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-700/80 dark:text-brand-200/80">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
