import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/form-elements';

export function Privacy() {
  return (
    <section id="privacy" className="relative px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Card className="relative overflow-hidden p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white sm:text-3xl">
            لن نظهر هويتك للشخص المستقبل
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-brand-700/90 dark:text-brand-200/90">
            بيانات المرسل محمية على مستوى النظام نفسه، مش بس مخفية في الواجهة.
            بنستخدم هوية مجهولة (fingerprint) بغرض واحد فقط: منع السبام
            وإساءة الاستخدام — من غير ما ده يكشف هويتك لأي حد، حتى المستقبل نفسه.
          </p>
        </Card>
      </div>
    </section>
  );
}
