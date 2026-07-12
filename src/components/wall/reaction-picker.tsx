'use client';

import * as React from 'react';
import { REACTION_EMOJIS } from '@/constants/message';
import { setReactionAction } from '@/actions/reactions';
import type { ReactionEmoji } from '@/types/domain';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Milestone 1: one reaction per authenticated user, changeable. Replaces
 * the earlier anonymous fingerprint-based multi-emoji picker — tapping a
 * different emoji swaps the reaction, tapping the active one clears it.
 */
export function ReactionPicker({
  messageId,
  initialCounts,
  initialMyReaction,
  isAuthenticated,
}: {
  messageId: string;
  initialCounts: Record<ReactionEmoji, number>;
  initialMyReaction: ReactionEmoji | null;
  isAuthenticated: boolean;
}) {
  const [counts, setCounts] = React.useState(initialCounts);
  const [myReaction, setMyReaction] = React.useState<ReactionEmoji | null>(initialMyReaction);
  const [pending, setPending] = React.useState(false);

  async function handleReact(emoji: ReactionEmoji) {
    if (pending) return;
    if (!isAuthenticated) {
      toast.error('لازم تسجل دخولك الأول عشان تتفاعل');
      return;
    }

    const previousReaction = myReaction;
    const previousCounts = counts;
    const isRemoving = previousReaction === emoji;

    setCounts((prev) => {
      const next = { ...prev };
      if (previousReaction) next[previousReaction] = Math.max(0, next[previousReaction] - 1);
      if (!isRemoving) next[emoji] = next[emoji] + 1;
      return next;
    });
    setMyReaction(isRemoving ? null : emoji);
    setPending(true);

    const result = await setReactionAction(messageId, isRemoving ? null : emoji);
    setPending(false);

    if (!result.success) {
      setCounts(previousCounts);
      setMyReaction(previousReaction);
      toast.error('حدث خطأ');
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          disabled={pending}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-transform active:scale-95 disabled:opacity-60',
            myReaction === emoji
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-brand-200/50 hover:border-brand-300 dark:border-white/10'
          )}
        >
          <span>{emoji}</span>
          {counts[emoji] > 0 && <span className="text-brand-500/70">{counts[emoji]}</span>}
        </button>
      ))}
    </div>
  );
}
