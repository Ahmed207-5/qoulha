'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Repeat2 } from 'lucide-react';
import { deleteRepostAdminAction } from '@/actions/reposts';
import { toast } from 'sonner';
import type { RepostEntry } from '@/services/message-detail-service';

export function RepostedByList({
  messageId,
  initialReposts,
  isAdmin,
}: {
  messageId: string;
  initialReposts: RepostEntry[];
  isAdmin?: boolean;
}) {
  const [reposts, setReposts] = React.useState(initialReposts);

  if (reposts.length === 0) return null;

  async function handleRemove(repostId: string) {
    const previous = reposts;
    setReposts((prev) => prev.filter((r) => r.id !== repostId));
    const result = await deleteRepostAdminAction(repostId, messageId);
    if (!result.success) {
      setReposts(previous);
      toast.error('حدث خطأ');
    }
  }

  return (
    <div className="mt-6">
      <h3 className="mb-3 flex items-center gap-1.5 font-display text-sm font-bold text-brand-950 dark:text-white">
        <Repeat2 className="h-4 w-4" />
        عملوا ريبوست ({reposts.length})
      </h3>
      <div className="space-y-2">
        {reposts.map((r) => (
          <div key={r.id} className="glass flex items-center justify-between rounded-2xl p-3">
            <Link href={`/u/${r.reposter.username}`} className="flex items-center gap-2">
              <div className="h-7 w-7 overflow-hidden rounded-full bg-brand-500/10">
                {r.reposter.avatar_url && (
                  <Image src={r.reposter.avatar_url} alt="" width={28} height={28} className="h-full w-full object-cover" />
                )}
              </div>
              <span className="text-xs font-medium text-brand-950 dark:text-white">{r.reposter.full_name}</span>
            </Link>
            {isAdmin && (
              <button onClick={() => handleRemove(r.id)} className="rounded-full p-1.5 hover:bg-red-500/10">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
