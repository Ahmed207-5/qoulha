'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DAILY_POST_TYPE_META } from '@/constants/daily-space';
import { DailySpaceReplyForm } from './daily-space-reply-form';
import { DailySpaceReplyItem } from './daily-space-reply-item';
import { MentionText } from '@/components/message/mention-text';
import type { DailyPost, DailyPostReply } from '@/types/domain';

export function TodaySpaceCard({
  post,
  initialReplies,
  isAuthenticated,
  currentUserId,
}: {
  post: DailyPost;
  initialReplies: DailyPostReply[];
  isAuthenticated: boolean;
  currentUserId?: string;
}) {
  const [replies, setReplies] = React.useState(initialReplies);
  const isRepliable = post.status === 'active';
  const alreadyReplied = !!currentUserId && replies.some((r) => r.author_id === currentUserId);
  const meta = DAILY_POST_TYPE_META[post.type];
  const Icon = meta.icon;

  return (
    <div>
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
          <span className="text-[11px] text-brand-500/60">
            {formatDistanceToNow(new Date(post.published_at), { addSuffix: true, locale: ar })}
          </span>
          {!isRepliable && (
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-500/70">
              مؤرشف
            </span>
          )}
        </div>

        {post.title && (
          <h3 className="mb-1 font-display text-lg font-bold text-brand-950 dark:text-white">{post.title}</h3>
        )}
        <p className="text-[15px] leading-relaxed text-brand-900 dark:text-brand-50">
          <MentionText content={post.content} />
        </p>
      </div>

      {isRepliable && isAuthenticated && !alreadyReplied && (
        <div className="mb-5">
          <DailySpaceReplyForm
            dailyPostId={post.id}
            placeholder="شارك رأيك... (استخدم @ عشان تشير لحد)"
            onPosted={(reply) => setReplies((prev) => [...prev, reply])}
          />
        </div>
      )}

      {isRepliable && !isAuthenticated && (
        <p className="mb-5 rounded-2xl bg-brand-500/5 p-3 text-center text-xs text-brand-500/70">
          لازم تسجل دخولك عشان تشارك برأيك
        </p>
      )}

      {isRepliable && alreadyReplied && (
        <p className="mb-5 rounded-2xl bg-brand-500/5 p-3 text-center text-xs text-brand-500/70">
          شاركت رأيك بالفعل على منشور اليوم — تقدر تتفاعل مع ردود التانيين
        </p>
      )}

      {replies.length === 0 ? (
        <p className="rounded-2xl bg-brand-500/5 p-5 text-center text-xs text-brand-500/70">
          لسه محدش رد، كن أول واحد يشارك رأيه
        </p>
      ) : (
        <div className="space-y-3">
          {replies.map((reply) => (
            <DailySpaceReplyItem
              key={reply.id}
              reply={reply}
              dailyPostId={post.id}
              isAuthenticated={isAuthenticated}
              isRepliable={isRepliable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
