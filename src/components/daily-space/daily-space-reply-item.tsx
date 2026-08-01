'use client';

import * as React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';
import { MentionText } from '@/components/message/mention-text';
import { DailySpaceLikeButton } from './daily-space-like-button';
import { DailySpaceReplyForm } from './daily-space-reply-form';
import { cn } from '@/lib/utils';
import type { DailyPostReply } from '@/types/domain';

export function DailySpaceReplyItem({
  reply,
  dailyPostId,
  isAuthenticated,
  isNested = false,
  isRepliable = true,
}: {
  reply: DailyPostReply;
  dailyPostId: string;
  isAuthenticated: boolean;
  /** Top-level replies render indented, uncollapsible nested replies below them. */
  isNested?: boolean;
  /** False once the daily post is archived — thread stays visible, just read-only. */
  isRepliable?: boolean;
}) {
  const [nestedReplies, setNestedReplies] = React.useState(reply.replies);
  const [showReplyForm, setShowReplyForm] = React.useState(false);

  return (
    <div className={cn(isNested ? 'rounded-xl bg-brand-500/5 p-3' : 'glass rounded-2xl p-4')}>
      <div className="mb-1.5 flex items-center gap-2">
        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-brand-500/10">
          {reply.author.avatar_url && (
            <Image
              src={reply.author.avatar_url}
              alt=""
              width={24}
              height={24}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <span className="text-xs font-semibold text-brand-950 dark:text-white">{reply.author.full_name}</span>
        <span className="text-[11px] text-brand-500/60">
          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ar })}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-brand-900 dark:text-brand-50">
        <MentionText content={reply.content} />
      </p>

      <div className="mt-2 flex items-center gap-3">
        <DailySpaceLikeButton
          replyId={reply.id}
          initialLikeCount={reply.like_count}
          initialLiked={reply.liked_by_me}
          isAuthenticated={isAuthenticated}
        />
        {!isNested && isRepliable && (
          <button
            type="button"
            onClick={() => setShowReplyForm((v) => !v)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-brand-500/70 hover:text-brand-500"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            رد
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="mt-3">
          <DailySpaceReplyForm
            dailyPostId={dailyPostId}
            parentReplyId={reply.id}
            placeholder={`اكتب رد لـ ${reply.author.full_name}...`}
            autoFocus
            onPosted={(posted) => {
              setNestedReplies((prev) => [...prev, posted]);
              setShowReplyForm(false);
            }}
          />
        </div>
      )}

      {nestedReplies.length > 0 && (
        <div className="mt-3 space-y-2 border-e-2 border-brand-500/15 pe-3">
          {nestedReplies.map((nested) => (
            <DailySpaceReplyItem
              key={nested.id}
              reply={nested}
              dailyPostId={dailyPostId}
              isAuthenticated={isAuthenticated}
              isNested
              isRepliable={isRepliable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
