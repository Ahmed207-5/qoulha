'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { upsertReplyAction, deleteReplyAction } from '@/actions/replies';
import { toast } from 'sonner';
import { CornerUpLeft, Pencil, Trash2 } from 'lucide-react';
import type { Reply } from '@/types/domain';

export function ReplyManager({ messageId, initialReply }: { messageId: string; initialReply: Reply | null }) {
  const [reply, setReply] = React.useState(initialReply);
  const [editing, setEditing] = React.useState(false);
  const [content, setContent] = React.useState(initialReply?.content ?? '');
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave() {
    setSubmitting(true);
    const result = await upsertReplyAction({ messageId, content });
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'حدث خطأ');
      return;
    }
    setReply((prev) => ({
      id: prev?.id ?? messageId,
      message_id: messageId,
      author_id: prev?.author_id ?? '',
      content,
      created_at: prev?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    setEditing(false);
    toast.success('اتحفظ الرد');
  }

  async function handleDelete() {
    setSubmitting(true);
    const result = await deleteReplyAction(messageId);
    setSubmitting(false);
    if (!result.success) {
      toast.error('حدث خطأ');
      return;
    }
    setReply(null);
    setContent('');
    toast.success('اتشال الرد');
  }

  if (!reply && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:underline"
      >
        <CornerUpLeft className="h-3.5 w-3.5" />
        رد على الرسالة دي
      </button>
    );
  }

  if (editing) {
    return (
      <div className="mt-3 space-y-2 rounded-2xl border-r-2 border-brand-400/40 bg-brand-500/5 p-3">
        <Textarea
          rows={2}
          maxLength={500}
          placeholder="اكتب ردك..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} isLoading={submitting} disabled={!content.trim()}>
            حفظ
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setContent(reply?.content ?? '');
            }}
          >
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border-r-2 border-brand-400/40 bg-brand-500/5 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-500">
          <CornerUpLeft className="h-3.5 w-3.5" />
          ردك
        </span>
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="rounded-full p-1 hover:bg-brand-500/10">
            <Pencil className="h-3.5 w-3.5 text-brand-500" />
          </button>
          <button onClick={handleDelete} className="rounded-full p-1 hover:bg-red-500/10">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-brand-900 dark:text-brand-50">{reply?.content}</p>
    </div>
  );
}
