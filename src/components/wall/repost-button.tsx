'use client';

import * as React from 'react';
import { Repeat2 } from 'lucide-react';
import { toggleRepostAction } from '@/actions/reposts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function RepostButton({
  messageId,
  initialCount,
  initialReposted,
  isAuthenticated,
}: {
  messageId: string;
  initialCount: number;
  initialReposted: boolean;
  isAuthenticated: boolean;
}) {
  const [count, setCount] = React.useState(initialCount);
  const [reposted, setReposted] = React.useState(initialReposted);
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      toast.error('لازم تسجل دخولك عشان تعمل ريبوست');
      return;
    }
    if (pending) return;

    const next = !reposted;
    setReposted(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setPending(true);
    const result = await toggleRepostAction(messageId, next);
    setPending(false);

    if (!result.success) {
      setReposted(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast.error('حدث خطأ');
    } else {
      toast.success(next ? 'اتعمل ريبوست للرسالة على صفحتك' : 'اتشال الريبوست');
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'flex items-center gap-1 rounded-full p-1.5 transition-colors disabled:opacity-60',
        reposted ? 'bg-green-500/10 text-green-500' : 'text-brand-500 hover:bg-brand-500/10'
      )}
    >
      <Repeat2 className="h-4 w-4" />
      {count > 0 && <span className="text-[11px]">{count}</span>}
    </button>
  );
}
