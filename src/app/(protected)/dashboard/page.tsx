import { createClient } from '@/lib/supabase/server';
import { getDashboardStats, getWeeklyMessageCounts, getMostSuccessfulMessage, getMostActiveDay } from '@/services/dashboard-service';
import { getFollowStats } from '@/services/follow-service';
import { getUserLevelInfo } from '@/services/gamification-service';
import { StatCard } from '@/components/dashboard/stat-card';
import { WeeklyActivityChart } from '@/components/dashboard/weekly-activity-chart';
import { LevelProgress } from '@/components/profile/level-progress';
import { MessageCard } from '@/components/message/message-card';
import { Inbox, MailOpen, CalendarDays, TrendingUp, Eye, Share2, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import type { InboxMessage, Reply } from '@/types/domain';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'لوحة التحكم' };

interface RecentMessageRow {
  id: string;
  recipient_id: string;
  content: string;
  category: InboxMessage['category'];
  mood: InboxMessage['mood'];
  is_read: boolean;
  is_favorited: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  replies: Reply | Reply[] | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [stats, weekly, { data: recent }, followStats, levelInfo, mostSuccessful, mostActiveDay] = await Promise.all([
    getDashboardStats(user.id),
    getWeeklyMessageCounts(user.id),
    supabase
      .from('messages')
      .select(
        'id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at, replies(id, message_id, author_id, content, created_at, updated_at)'
      )
      .eq('recipient_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5),
    getFollowStats(user.id),
    getUserLevelInfo(user.id),
    getMostSuccessfulMessage(user.id),
    getMostActiveDay(user.id),
  ]);

  const recentMessages: InboxMessage[] = (recent as unknown as RecentMessageRow[] | null ?? []).map((row) => ({
    id: row.id,
    recipient_id: row.recipient_id,
    content: row.content,
    category: row.category,
    mood: row.mood,
    is_read: row.is_read,
    is_favorited: row.is_favorited,
    is_published: row.is_published,
    published_at: row.published_at,
    created_at: row.created_at,
    reply: Array.isArray(row.replies) ? (row.replies[0] ?? null) : row.replies,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">أهلاً بيك 👋</h1>
        <p className="text-sm text-brand-700/70 dark:text-brand-200/70">نظرة سريعة على صفحتك</p>
      </div>

      <div className="glass rounded-3xl p-5">
        <LevelProgress levelInfo={levelInfo} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="رسائل غير مقروءة" value={stats.unread} icon={Inbox} />
        <StatCard label="رسائل مقروءة" value={stats.totalRead} icon={MailOpen} />
        <StatCard label="النهاردة" value={stats.today} icon={CalendarDays} />
        <StatCard label="الأسبوع ده" value={stats.thisWeek} icon={TrendingUp} />
        <StatCard label="زوار الصفحة" value={stats.visitors} icon={Eye} />
        <StatCard label="منشور على الحائط" value={stats.published} icon={Share2} />
        <StatCard label="متابعين" value={followStats.followerCount} icon={Users} />
        <StatCard label="بتتابع" value={followStats.followingCount} icon={Users} />
      </div>

      {(mostSuccessful || mostActiveDay) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {mostSuccessful && (
            <Link href={`/m/${mostSuccessful.id}`} className="glass block rounded-3xl p-5 transition-transform hover:-translate-y-0.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs text-brand-500">
                <Trophy className="h-3.5 w-3.5" />
                أنجح رسالة ليك
              </div>
              <p className="line-clamp-2 text-sm text-brand-900 dark:text-brand-50">{mostSuccessful.content}</p>
              <p className="mt-1.5 text-[11px] text-brand-500/60">
                {CATEGORY_META[mostSuccessful.category].label} · نقاط تفاعل: {mostSuccessful.engagementScore}
              </p>
            </Link>
          )}
          {mostActiveDay && (
            <div className="glass rounded-3xl p-5">
              <p className="text-xs text-brand-700/70 dark:text-brand-200/70">أكتر يوم بتوصلك رسايل فيه</p>
              <p className="mt-1 font-display text-lg font-bold text-brand-950 dark:text-white">{mostActiveDay}</p>
            </div>
          )}
        </div>
      )}

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
        {recentMessages.length > 0 ? (
          <div className="space-y-3">
            {recentMessages.map((msg) => (
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
