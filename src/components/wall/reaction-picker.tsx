'use client';

import * as React from 'react';
import { REACTION_EMOJIS } from '@/constants/message';
import { addReactionAction } from '@/actions/message-mutations';
import type { ReactionEmoji } from '@/types/domain';
import { cn } from '@/lib/utils';

// Client-side fingerprint stand-in: a random id persisted in-memory for this
// tab session, used only to dedupe rapid double-taps before the server's
// unique constraint (message_id, reactor_fingerprint, emoji) settles it.
const sessionFingerprint = typeof window !== 'undefined' ? crypto.randomUUID() : 'ssr';

export function ReactionPicker({
  messageId,
  initialCounts,
}: {
  messageId: string;
  initialCounts: Record<ReactionEmoji, number>;
}) {
  const [counts, setCounts] = React.useState(initialCounts);
  const [reacted, setReacted] = React.useState<Set<ReactionEmoji>>(new Set());

  async function handleReact(emoji: ReactionEmoji) {
    if (reacted.has(emoji)) return;
    setReacted((prev) => new Set(prev).add(emoji));
    setCounts((prev) => ({ ...prev, [emoji]: prev[emoji] + 1 }));
    await addReactionAction(messageId, emoji, sessionFingerprint);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-transform active:scale-95',
            reacted.has(emoji)
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
