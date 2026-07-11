import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';
import { Card } from '@/components/ui/form-elements';
import { FloatingBackground } from '@/components/landing/floating-background';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'إعداد صفحتك' };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_completed) redirect('/dashboard');

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <FloatingBackground />
      <div className="w-full max-w-md">
        <Card className="p-8">
          <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">
            خلينا نجهز صفحتك
          </h1>
          <p className="mt-1.5 text-sm text-brand-700/80 dark:text-brand-200/80">
            كام تفصيلة بسيطة وهتكون جاهز تستقبل رسائلك
          </p>
          <div className="mt-6">
            <OnboardingForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
