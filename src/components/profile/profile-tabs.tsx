'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getProfileReplies, getProfileComments, getProfileActivity } from '@/services/profile-activity-service';
import { WallGrid } from '@/components/wall/wall-grid';
import { CornerUpLeft, MessageCircle, Heart, Repeat2, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Tab = 'messages' | 'replies' | 'comments' | 'activity' | 'saved';

const TABS: { value: Tab; label: string }[] = [
  { value: 'messages', label: 'الرسائل' },
  { value: 'replies', label: 'الردود' },
  { value: 'comments', label: 'التعليقات' },
  { value: 'activity', label: 'النشاط' },
  { value: 'saved', label: 'محفوظات' },
];

const ACTIVITY_META: Record<string, { icon: typeof Heart; label: string }> = {
  reply: { icon: CornerUpLeft, label: 'رد على رسالة' },
  comment: { icon: MessageCircle, label: 'علّق على رسالة' },
  reaction: { icon: Heart, label: 'تفاعل مع رسالة' },
  repost: { icon: Repeat2, label: 'عمل ريبوست لرسالة' },
};

export function ProfileTabs({ profileId, viewerId }: { profileId: string; viewerId?: string }) {
  const [tab, setTab] = React.useState<Tab>('messages');

  const repliesQuery = useQuery({
    queryKey: ['profile-replies', profileId],
    queryFn: () => getProfileReplies(profileId),
    enabled: tab === 'replies',
  });
  const commentsQuery = useQuery({
    queryKey: ['profile-comments', profileId],
    queryFn: () => getProfileComments(profileId),
    enabled: tab === 'comments',
  });
  const activityQuery = useQuery({
    queryKey: ['profile-activity', profileId],
    queryFn: () => getProfileActivity(profileId),
    enabled: tab === 'activity',
  });

  return (
    <div className="mt-8">
      <div className="mb-5 flex justify-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium',
              tab === t.value ? 'bg-brand-500 text-white' : 'text-brand-600 hover:bg-brand-500/10 dark:text-brand-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'messages' && <WallGrid viewerId={viewerId} recipientId={profileId} hideSearch />}

      {tab === 'replies' && (
        <div className="space-y-3">
          {(repliesQuery.data ?? []).map((entry, i) => (
            <Link key={i} href={`/m/${entry.messageId}`} className="glass block rounded-2xl p-4">
              <p className="text-xs text-brand-500/70 line-clamp-1">{entry.content}</p>
              <p className="mt-1 text-sm text-brand-900 dark:text-brand-50">{entry.replyContent}</p>
              <p className="mt-1.5 text-[11px] text-brand-500/60">
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: ar })}
              </p>
            </Link>
          ))}
          {repliesQuery.data?.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center text-sm text-brand-500/60">لسه مفيش ردود</p>
          )}
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-3">
          {(commentsQuery.data ?? []).map((entry, i) => (
            <Link key={i} href={`/m/${entry.messageId}`} className="glass block rounded-2xl p-4">
              <p className="text-xs text-brand-500/70 line-clamp-1">{entry.messageContent}</p>
              <p className="mt-1 text-sm text-brand-900 dark:text-brand-50">{entry.commentContent}</p>
              <p className="mt-1.5 text-[11px] text-brand-500/60">
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: ar })}
              </p>
            </Link>
          ))}
          {commentsQuery.data?.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center text-sm text-brand-500/60">لسه مفيش تعليقات</p>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-2">
          {(activityQuery.data ?? []).map((entry, i) => {
            const meta = ACTIVITY_META[entry.kind];
            const Icon = meta?.icon ?? Heart;
            return (
              <Link key={i} href={`/m/${entry.messageId}`} className="glass flex items-center gap-3 rounded-2xl p-3">
                <Icon className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="flex-1 text-xs text-brand-700/80 dark:text-brand-200/80">{meta?.label}</span>
                <span className="text-[11px] text-brand-500/60">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: ar })}
                </span>
              </Link>
            );
          })}
          {activityQuery.data?.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center text-sm text-brand-500/60">لسه مفيش نشاط</p>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl p-10 text-center">
          <Bookmark className="h-8 w-8 text-brand-300" />
          <p className="text-sm text-brand-500/70">الرسائل المحفوظة — قريبًا</p>
        </div>
      )}
    </div>
  );
}
