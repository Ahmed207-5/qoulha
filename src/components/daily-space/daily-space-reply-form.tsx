'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { MentionAutocomplete } from '@/components/message/mention-autocomplete';
import { useMentionInput } from '@/hooks/use-mention-input';
import { createDailyReplyAction } from '@/actions/daily-space';
import { DAILY_REPLY_MAX_LENGTH } from '@/constants/daily-space';
import { toast } from 'sonner';
import type { DailyPostReply } from '@/types/domain';

/**
 * One composer, two jobs: posting the caller's single top-level public
 * reply to the daily post (parentReplyId omitted), or replying to
 * another user's reply (parentReplyId set). Mirrors CommentForm's shape
 * exactly, reusing the same mention hook/autocomplete.
 */
export function DailySpaceReplyForm({
  dailyPostId,
  parentReplyId,
  placeholder,
  autoFocus,
  onPosted,
}: {
  dailyPostId: string;
  parentReplyId?: string;
  placeholder: string;
  autoFocus?: boolean;
  onPosted: (reply: DailyPostReply) => void;
}) {
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const { textareaRef, mentionQuery, handleChange, handleSelectMention, handleCursorMove, closeMentionDropdown } =
    useMentionInput(content, setContent);

  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus, textareaRef]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const result = await createDailyReplyAction({ dailyPostId, parentReplyId, content });
    setSubmitting(false);
    if (!result.success || !result.reply) {
      toast.error(result.error ?? 'حدث خطأ');
      return;
    }
    onPosted(result.reply);
    setContent('');
    closeMentionDropdown();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        {mentionQuery !== null && <MentionAutocomplete query={mentionQuery} onSelect={handleSelectMention} />}
        <Textarea
          ref={textareaRef}
          rows={1}
          maxLength={DAILY_REPLY_MAX_LENGTH}
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          onBlur={closeMentionDropdown}
          className="flex-1"
        />
      </div>
      <Button type="submit" size="sm" isLoading={submitting} disabled={!content.trim()}>
        نشر
      </Button>
    </form>
  );
}
