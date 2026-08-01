'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { toggleDailyReplyLikeAction } from '@/actions/daily-space';
import { cn } from '@/lib/utils';

export function DailySpaceLikeButton({
  replyId,
  initialLikeCount,
  initialLiked,
  isAuthenticated,
}: {
  replyId: string;
  initialLikeCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
}) {
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialLikeCount);
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      toast.error('لازم تسجل دخولك عشان تعمل لايك');
      return;
    }
    if (pending) return;

    // Optimistic toggle, rolled back on failure.
    const previousLiked = liked;
    const previousCount = count;
    setLiked(!previousLiked);
    setCount(previousLiked ? previousCount - 1 : previousCount + 1);
    setPending(true);

    const result = await toggleDailyReplyLikeAction(replyId);

    setPending(false);
    if (!result.success) {
      setLiked(previousLiked);
      setCount(previousCount);
      toast.error(result.error ?? 'حدث خطأ');
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors',
        liked ? 'text-red-500' : 'text-brand-500/70 hover:text-red-500'
      )}
    >
      <Heart className={cn('h-3.5 w-3.5', liked && 'fill-red-500')} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
