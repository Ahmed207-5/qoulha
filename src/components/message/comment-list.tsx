'use client';

import * as React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { getCommentsAction, deleteCommentAction } from '@/actions/comments';
import { CommentForm } from './comment-form';
import { MentionText } from './mention-text';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Comment } from '@/types/domain';

export function CommentList({
  messageId,
  initialComments,
  initialNextCursor,
  currentUserId,
  isAdmin,
}: {
  messageId: string;
  initialComments: Comment[];
  initialNextCursor: string | null;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const [comments, setComments] = React.useState(initialComments);
  const [nextCursor, setNextCursor] = React.useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = React.useState(false);

  async function handleLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const page = await getCommentsAction(messageId, nextCursor);
    setComments((prev) => [...prev, ...page.comments]);
    setNextCursor(page.nextCursor);
    setLoadingMore(false);
  }

  async function handleDelete(commentId: string) {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    const result = await deleteCommentAction(commentId, messageId);
    if (!result.success) {
      setComments(previous);
      toast.error('حدث خطأ');
    }
  }

  return (
    <div className="space-y-4">
      <CommentForm
        messageId={messageId}
        isAuthenticated={!!currentUserId}
        onPosted={(comment) => setComments((prev) => [comment, ...prev])}
      />

      {comments.length === 0 ? (
        <p className="glass rounded-2xl p-6 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
          لسه مفيش تعليقات، كن أول واحد يعلّق
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="glass rounded-2xl p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 overflow-hidden rounded-full bg-brand-500/10">
                    {comment.author.avatar_url && (
                      <Image
                        src={comment.author.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-brand-950 dark:text-white">
                    {comment.author.full_name}
                  </span>
                  <span className="text-[11px] text-brand-500/60">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
                  </span>
                </div>
                {(comment.author_id === currentUserId || isAdmin) && (
                  <button onClick={() => handleDelete(comment.id)} className="rounded-full p-1 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-brand-900 dark:text-brand-50">
                <MentionText content={comment.content} />
              </p>
            </div>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={handleLoadMore} isLoading={loadingMore}>
            حمّل تعليقات أكتر
          </Button>
        </div>
      )}
    </div>
  );
}
