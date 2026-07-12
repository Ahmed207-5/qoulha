'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { createCommentAction } from '@/actions/comments';
import { toast } from 'sonner';
import type { Comment } from '@/types/domain';

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

  if (!isAuthenticated) {
    return (
      <p className="glass rounded-2xl p-4 text-center text-xs text-brand-500/70">
        لازم تسجل دخولك عشان تقدر تعلّق
      </p>
    );
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
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        rows={1}
        maxLength={300}
        placeholder="اكتب تعليق..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="sm" isLoading={submitting} disabled={!content.trim()}>
        نشر
      </Button>
    </form>
  );
}
