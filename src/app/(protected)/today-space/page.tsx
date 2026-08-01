import { createClient } from '@/lib/supabase/server';
import { getActiveDailyPost } from '@/services/daily-space-service';
import { TodaySpaceSection } from '@/components/daily-space/today-space-section';
import { DailySpaceViewMarker } from '@/components/daily-space/daily-space-view-marker';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'مساحة اليوم',
  description: 'منشور اليوم اللي بتديره قولها — شارك رأيك، رد على التانيين، واستكشف الأرشيف',
};

export default async function TodaySpacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetched again here (a single cheap point-select, same query
  // TodaySpaceSection itself makes) purely so we know which post id to
  // mark as viewed — keeps the view-marking logic outside the section
  // component that's shared with (formerly) the Wall page.
  const activePost = await getActiveDailyPost();

  return (
    <div>
      {user && <DailySpaceViewMarker dailyPostId={activePost?.id ?? null} />}
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">💜 مساحة اليوم</h1>
        <p className="mt-1 text-sm text-brand-700/80 dark:text-brand-200/80">
          منشور واحد يوميًا تديره قولها — شارك رأيك ورد على التانيين
        </p>
      </div>
      <TodaySpaceSection viewerId={user?.id} />
    </div>
  );
}
