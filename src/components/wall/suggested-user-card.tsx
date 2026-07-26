'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleFollowAction } from '@/actions/follows';
import { toast } from 'sonner';
import type { SuggestedUser } from '@/types/domain';

export function SuggestedUserCard({ user, onFollowed }: { user: SuggestedUser; onFollowed: () => void }) {
  const [following, setFollowing] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleToggle() {
    if (pending) return;
    const next = !following;
    setFollowing(next);
    setPending(true);
    const result = await toggleFollowAction(user.id, next);
    setPending(false);

    if (!result.success) {
      setFollowing(!next);
      toast.error(result.error ?? 'حدث خطأ');
      return;
    }
    toast.success(next ? `بقيت متابع ${user.full_name}` : `مبقتش متابع ${user.full_name}`);
    if (next) onFollowed();
  }

  return (
    <div className="glass group flex w-40 shrink-0 snap-start flex-col items-center gap-2 rounded-3xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-44">
      <Link href={`/u/${user.username}`} className="flex flex-col items-center gap-2">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-brand-500/10 ring-2 ring-transparent transition group-hover:ring-brand-400/50">
          {user.avatar_url && (
            <Image src={user.avatar_url} alt="" width={64} height={64} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-950 dark:text-white">{user.full_name}</p>
          <p className="truncate text-xs text-brand-500/70">@{user.username}</p>
        </div>
      </Link>

      {user.bio && <p className="line-clamp-1 w-full text-[11px] text-brand-700/70 dark:text-brand-200/60">{user.bio}</p>}

      <div className="flex items-center gap-3 text-[11px] text-brand-500/60">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {user.follower_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {user.public_message_count}
        </span>
      </div>

      <Button
        variant={following ? 'secondary' : 'primary'}
        size="sm"
        className="mt-1 w-full"
        onClick={handleToggle}
        isLoading={pending}
      >
        {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        {following ? 'بتتابعه' : 'متابعة'}
      </Button>
    </div>
  );
}
