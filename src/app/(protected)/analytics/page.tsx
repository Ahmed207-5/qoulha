import { createClient } from '@/lib/supabase/server';
import { getCategoryDistribution, getMoodDistribution, getGrowthTrend } from '@/services/analytics-service';
import { getProfileLinkAnalytics } from '@/services/profile-link-analytics-service';
import { DistributionPieChart } from '@/components/dashboard/distribution-pie-chart';
import { GrowthLineChart } from '@/components/dashboard/growth-line-chart';
import { ProfileLinkAnalyticsCard } from '@/components/dashboard/profile-link-analytics-card';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الإحصائيات' };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [categories, moods, growth, linkAnalytics] = await Promise.all([
    getCategoryDistribution(user.id),
    getMoodDistribution(user.id),
    getGrowthTrend(user.id),
    getProfileLinkAnalytics(user.id),
  ]);

  const categoryData = categories.map((c) => ({
    name: CATEGORY_META[c.category].label,
    value: c.count,
    color: CATEGORY_META[c.category].color ?? '#9CA3AF',
  }));

  const MOOD_COLORS = ['#E8A87C', '#7FB3B0', '#8B7BA8', '#C77B6F', '#6B9B8F', '#E8C168', '#9CA3AF'];
  const moodData = moods.map((m, i) => ({
    name: `${MOOD_META[m.mood].emoji} ${MOOD_META[m.mood].label}`,
    value: m.count,
    color: MOOD_COLORS[i % MOOD_COLORS.length] ?? '#9CA3AF',
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">الإحصائيات</h1>
      <ProfileLinkAnalyticsCard analytics={linkAnalytics} />
      <GrowthLineChart data={growth} />
      <div className="grid gap-6 sm:grid-cols-2">
        <DistributionPieChart title="التصنيفات" data={categoryData} />
        <DistributionPieChart title="المشاعر" data={moodData} />
      </div>
    </div>
  );
}
