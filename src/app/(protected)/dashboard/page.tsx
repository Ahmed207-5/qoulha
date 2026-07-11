import { createClient } from '@/lib/supabase/server';
import { getDashboardStats, getWeeklyMessageCounts } from '@/services/dashboard-service';
import { StatCard } from '@/components/dashboard/stat-card';
import { WeeklyActivityChart } from '@/components/dashboard/weekly-activity-chart';
import { MessageCard } from '@/components/message/message-card';
import { Inbox, MailOpen, CalendarDays, TrendingUp, Eye, Share2 } from 'lucide-react';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import type { InboxMessage } from '@/types/domain';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'لوحة التحكم' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [stats, weekly, { data: recent }] = await Promise.all([
    getDashboardStats(user.id),
    getWeeklyMessageCounts(user.id),
    supabase
      .from('messages')
      .select('id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at')
      .eq('recipient_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">أهلاً بيك 👋</h1>
        <p className="text-sm text-brand-700/70 dark:text-brand-200/70">نظرة سريعة على صفحتك</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="رسائل غير مقروءة" value={stats.unread} icon={Inbox} />
        <StatCard label="رسائل مقروءة" value={stats.totalRead} icon={MailOpen} />
        <StatCard label="النهاردة" value={stats.today} icon={CalendarDays} />
        <StatCard label="الأسبوع ده" value={stats.thisWeek} icon={TrendingUp} />
        <StatCard label="زوار الصفحة" value={stats.visitors} icon={Eye} />
        <StatCard label="منشور على الحائط" value={stats.published} icon={Share2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyActivityChart data={weekly} />
        </div>
        <div className="space-y-4">
          {stats.topCategory && (
            <div className="glass rounded-3xl p-5">
              <p className="text-xs text-brand-700/70 dark:text-brand-200/70">أكتر تصنيف بيوصلك</p>
              <p className="mt-1 font-display text-lg font-bold text-brand-950 dark:text-white">
                {CATEGORY_META[stats.topCategory].label}
              </p>
            </div>
          )}
          {stats.topMood && (
            <div className="glass rounded-3xl p-5">
              <p className="text-xs text-brand-700/70 dark:text-brand-200/70">أكتر شعور بيوصلك</p>
              <p className="mt-1 font-display text-lg font-bold text-brand-950 dark:text-white">
                {MOOD_META[stats.topMood].emoji} {MOOD_META[stats.topMood].label}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-brand-950 dark:text-white">آخر الرسائل</h2>
        {recent && recent.length > 0 ? (
          <div className="space-y-3">
            {(recent as InboxMessage[]).map((msg) => (
              <MessageCard key={msg.id} message={msg} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
            لسه ملوصلكش رسائل — شارك رابط صفحتك عشان تبدأ تستقبل!
          </div>
        )}
      </div>
    </div>
  );
}
