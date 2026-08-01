import { getActiveDailyPost, getArchivedDailyPosts, getDailyPostReplies } from '@/services/daily-space-service';
import { TodaySpaceCard } from './today-space-card';
import { DailySpaceArchive } from './daily-space-archive';

/**
 * "Today's Space" (مساحة اليوم) — platform-managed, one active daily post
 * at a time. Lives on its own dedicated page (src/app/(protected)/today-space),
 * reachable from the sidebar — no longer embedded above the Wall.
 */
export async function TodaySpaceSection({ viewerId }: { viewerId?: string }) {
  const activePost = await getActiveDailyPost();

  if (!activePost) {
    const { posts } = await getArchivedDailyPosts(undefined, 1);
    return (
      <section className="mx-auto max-w-2xl">
        <div className="rounded-[2rem] border border-brand-400/20 bg-gradient-to-br from-brand-400/10 via-brand-500/5 to-transparent p-6 text-center">
          <p className="text-sm text-brand-700/80 dark:text-brand-200/80">
            {posts.length > 0
              ? 'منشور النهاردة منزلش لسة,تابع الأرشيف لحد ما ينزل'
              : 'لسه محدش نشر أي منشور في مساحة اليوم، تابعونا قريبًا'}
          </p>
          <div className="mt-3 flex justify-center">
            <DailySpaceArchive isAuthenticated={!!viewerId} currentUserId={viewerId} />
          </div>
        </div>
      </section>
    );
  }

  const replies = await getDailyPostReplies(activePost.id, viewerId);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="rounded-[2rem] border border-brand-400/20 bg-gradient-to-br from-brand-400/10 via-brand-500/5 to-transparent p-1">
        <div className="rounded-[1.875rem] bg-surface-light/70 p-5 dark:bg-surface-dark/70">
          <TodaySpaceCard
            post={activePost}
            initialReplies={replies}
            isAuthenticated={!!viewerId}
            currentUserId={viewerId}
          />
          <div className="mt-4 flex justify-center border-t border-brand-500/10 pt-3">
            <DailySpaceArchive isAuthenticated={!!viewerId} currentUserId={viewerId} />
          </div>
        </div>
      </div>
    </section>
  );
}
