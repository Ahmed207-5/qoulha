import { CornerUpLeft } from 'lucide-react';
import type { Reply } from '@/types/domain';

export function ReplyDisplay({ reply, recipientName }: { reply: Reply; recipientName: string }) {
  return (
    <div className="mt-3 rounded-2xl border-r-2 border-brand-400/40 bg-brand-500/5 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand-500">
        <CornerUpLeft className="h-3.5 w-3.5" />
        رد {recipientName}
      </div>
      <p className="text-sm leading-relaxed text-brand-900 dark:text-brand-50">{reply.content}</p>
    </div>
  );
}
