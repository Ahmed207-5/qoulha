'use client';

import * as React from 'react';
import { Archive, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DAILY_POST_TYPE_META } from '@/constants/daily-space';
import { getDailyPostArchiveAction, getDailyPostDetailAction } from '@/actions/daily-space';
import { TodaySpaceCard } from './today-space-card';
import type { DailyPost, DailyPostReply, DailyPostSummary } from '@/types/domain';

interface DailyPostDetail {
  post: DailyPost;
  replies: DailyPostReply[];
}

/**
 * "Older daily posts should be archived and remain viewable." This is the
 * browser for that archive — a lightweight overlay (no separate route)
 * listing past daily posts, opening any of them read-only in the same
 * <TodaySpaceCard/> used for today's post (isRepliable comes from the
 * post's own status, so the card itself hides the composer automatically).
 */
export function DailySpaceArchive({
  isAuthenticated,
  currentUserId,
}: {
  isAuthenticated: boolean;
  currentUserId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [posts, setPosts] = React.useState<DailyPostSummary[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loadingList, setLoadingList] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [selected, setSelected] = React.useState<DailyPostDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  async function handleOpen() {
    setOpen(true);
    if (hasLoaded) return;
    setLoadingList(true);
    const page = await getDailyPostArchiveAction();
    setPosts(page.posts);
    setNextCursor(page.nextCursor);
    setLoadingList(false);
    setHasLoaded(true);
  }

  async function handleLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const page = await getDailyPostArchiveAction(nextCursor);
    setPosts((prev) => [...prev, ...page.posts]);
    setNextCursor(page.nextCursor);
    setLoadingMore(false);
  }

  async function handleSelect(id: string) {
    setLoadingDetail(true);
    const detail = await getDailyPostDetailAction(id);
    setLoadingDetail(false);
    if (detail.post) setSelected({ post: detail.post, replies: detail.replies });
  }

  function handleClose() {
    setOpen(false);
    setSelected(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-brand-500/70 hover:text-brand-500"
      >
        <Archive className="h-3.5 w-3.5" />
        أرشيف مساحة اليوم
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="glass-strong relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute left-4 top-4 rounded-full p-1.5 hover:bg-brand-500/10"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>

            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mb-4 text-xs font-medium text-brand-500 hover:underline"
                >
                  ← رجوع لأرشيف مساحة اليوم
                </button>
                {loadingDetail ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-500" />
                ) : (
                  <TodaySpaceCard
                    post={selected.post}
                    initialReplies={selected.replies}
                    isAuthenticated={isAuthenticated}
                    currentUserId={currentUserId}
                  />
                )}
              </>
            ) : (
              <>
                <h4 className="mb-4 font-display text-lg font-bold text-brand-950 dark:text-white">
                  أرشيف مساحة اليوم
                </h4>

                {loadingList ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                  </div>
                ) : posts.length === 0 ? (
                  <p className="py-8 text-center text-xs text-brand-500/70">لسه مفيش منشورات مؤرشفة</p>
                ) : (
                  <div className="space-y-2">
                    {posts.map((p) => {
                      const meta = DAILY_POST_TYPE_META[p.type];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelect(p.id)}
                          className="w-full rounded-2xl bg-brand-500/5 p-3 text-right transition-colors hover:bg-brand-500/10"
                        >
                          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: meta.color }}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                            <span className="mr-auto font-normal text-brand-500/60">
                              {formatDistanceToNow(new Date(p.published_at), { addSuffix: true, locale: ar })}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-brand-900 dark:text-brand-50">{p.content}</p>
                          <p className="mt-1 text-[11px] text-brand-500/60">{p.reply_count} رد</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {nextCursor && (
                  <div className="mt-3 flex justify-center">
                    <Button variant="ghost" size="sm" onClick={handleLoadMore} isLoading={loadingMore}>
                      حمّل منشورات أكتر
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
