'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, Textarea, Input } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { Send, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createDailyPostAction, archiveDailyPostAction } from '@/actions/admin';
import { DAILY_POST_TYPE_META, DAILY_POST_TYPE_OPTIONS } from '@/constants/daily-space';
import type { DailyPost, DailyPostSummary, DailyPostType } from '@/types/domain';

export function AdminDailySpaceManager({
  initialActivePost,
  initialArchive,
}: {
  initialActivePost: DailyPost | null;
  initialArchive: DailyPostSummary[];
}) {
  const [activePost, setActivePost] = React.useState(initialActivePost);
  const [archive, setArchive] = React.useState(initialArchive);
  const [type, setType] = React.useState<DailyPostType>('question');
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [publishing, setPublishing] = React.useState(false);
  const [endingNow, setEndingNow] = React.useState(false);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPublishing(true);
    const result = await createDailyPostAction({ type, title: title.trim() || undefined, content });
    setPublishing(false);

    if (!result.success || !result.post) {
      toast.error(result.error ?? 'حدث خطأ');
      return;
    }

    // The previous active post (if any) was archived server-side in the
    // same transaction — reflect that locally instead of refetching.
    if (activePost) {
      setArchive((prev) => [{ ...activePost, status: 'archived', archived_at: new Date().toISOString(), reply_count: 0 }, ...prev]);
    }
    setActivePost(result.post);
    setTitle('');
    setContent('');
    toast.success('اتنشر منشور اليوم');
  }

  async function handleEndNow() {
    if (!activePost) return;
    setEndingNow(true);
    const result = await archiveDailyPostAction(activePost.id);
    setEndingNow(false);
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ');
      return;
    }
    setArchive((prev) => [{ ...activePost, status: 'archived', archived_at: new Date().toISOString(), reply_count: 0 }, ...prev]);
    setActivePost(null);
    toast.success('تم إنهاء منشور اليوم');
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-brand-950 dark:text-white">نشر منشور جديد</h2>
        <form onSubmit={handlePublish} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {DAILY_POST_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={
                  type === opt.value
                    ? 'rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white'
                    : 'rounded-full bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300'
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Input placeholder="عنوان اختياري" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          <Textarea
            placeholder="اكتب محتوى منشور اليوم..."
            rows={3}
            maxLength={1000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button type="submit" size="sm" isLoading={publishing} disabled={!content.trim()}>
            <Send className="h-3.5 w-3.5" />
            نشر منشور اليوم
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-brand-950 dark:text-white">المنشور النشط حاليًا</h2>
        {!activePost ? (
          <p className="text-xs text-brand-500/70">مفيش منشور نشط دلوقتي</p>
        ) : (
          <div className="rounded-2xl bg-brand-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold" style={{ color: DAILY_POST_TYPE_META[activePost.type].color }}>
              {DAILY_POST_TYPE_META[activePost.type].label}
              <span className="font-normal text-brand-500/60">
                {formatDistanceToNow(new Date(activePost.published_at), { addSuffix: true, locale: ar })}
              </span>
            </div>
            {activePost.title && <p className="mb-1 text-sm font-bold text-brand-950 dark:text-white">{activePost.title}</p>}
            <p className="text-sm text-brand-900 dark:text-brand-50">{activePost.content}</p>
            <div className="mt-3">
              <Button variant="destructive" size="sm" onClick={handleEndNow} isLoading={endingNow}>
                <StopCircle className="h-3.5 w-3.5" />
                إنهاء النشر الآن
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-brand-950 dark:text-white">آخر المنشورات المؤرشفة</h2>
        {archive.length === 0 ? (
          <p className="text-xs text-brand-500/70">لسه مفيش منشورات مؤرشفة</p>
        ) : (
          <div className="space-y-2">
            {archive.map((post) => (
              <div key={post.id} className="rounded-2xl bg-brand-500/5 p-3">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: DAILY_POST_TYPE_META[post.type].color }}>
                    {DAILY_POST_TYPE_META[post.type].label}
                  </span>
                  <span className="text-brand-500/60">{post.reply_count} رد</span>
                </div>
                <p className="line-clamp-2 text-xs text-brand-900 dark:text-brand-50">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
