'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { createCommentAction } from '@/actions/comments';
import { MentionAutocomplete } from './mention-autocomplete';
import { toast } from 'sonner';
import type { Comment } from '@/types/domain';

const MENTION_COUNT_PATTERN = /@[A-Za-z0-9_]{2,30}/g;
// Matches an in-progress @query right at the cursor — requires the '@' to
// start a word (start of text or preceded by whitespace) so "email@x" etc.
// never triggers the dropdown.
const ACTIVE_MENTION_PATTERN = /(?:^|\s)@([A-Za-z0-9_]{0,30})$/;
const MAX_MENTIONS = 5;

export function CommentForm({
  messageId,
  isAuthenticated,
  onPosted,
}: {
  messageId: string;
  isAuthenticated: boolean;
  onPosted: (comment: Comment) => void;
}) {
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [mentionStart, setMentionStart] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  if (!isAuthenticated) {
    return (
      <p className="glass rounded-2xl p-4 text-center text-xs text-brand-500/70">
        لازم تسجل دخولك عشان تقدر تعلّق
      </p>
    );
  }

  function updateMentionState(value: string, cursor: number) {
    const alreadyMentioned = value.match(MENTION_COUNT_PATTERN)?.length ?? 0;
    const match = value.slice(0, cursor).match(ACTIVE_MENTION_PATTERN);
    if (match && alreadyMentioned < MAX_MENTIONS) {
      const partialUsername = match[1] ?? '';
      setMentionQuery(partialUsername);
      setMentionStart(cursor - partialUsername.length - 1);
    } else {
      setMentionQuery(null);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    updateMentionState(e.target.value, e.target.selectionStart ?? e.target.value.length);
  }

  function handleSelectMention(username: string) {
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const inserted = `@${username} `;
    const nextContent = content.slice(0, mentionStart) + inserted + content.slice(cursor);
    setContent(nextContent);
    setMentionQuery(null);

    const nextCursor = mentionStart + inserted.length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const result = await createCommentAction({ messageId, content });
    setSubmitting(false);
    if (!result.success || !result.comment) {
      toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'حدث خطأ');
      return;
    }
    onPosted(result.comment);
    setContent('');
    setMentionQuery(null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        {mentionQuery !== null && <MentionAutocomplete query={mentionQuery} onSelect={handleSelectMention} />}
        <Textarea
          ref={textareaRef}
          rows={1}
          maxLength={300}
          placeholder="اكتب تعليق... (استخدم @ عشان تشير لحد)"
          value={content}
          onChange={handleChange}
          onClick={(e) => updateMentionState(content, e.currentTarget.selectionStart ?? content.length)}
          onKeyUp={(e) => updateMentionState(content, e.currentTarget.selectionStart ?? content.length)}
          onBlur={() => setMentionQuery(null)}
          className="flex-1"
        />
      </div>
      <Button type="submit" size="sm" isLoading={submitting} disabled={!content.trim()}>
        نشر
      </Button>
    </form>
  );
}
