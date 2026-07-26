'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users, MessageCircle } from 'lucide-react';
import { FollowButton } from '@/components/profile/follow-button';
import type { SuggestedUser } from '@/types/domain';

export function SuggestedUserCard({ user }: { user: SuggestedUser }) {
  return (
    <div className="glass group flex w-36 shrink-0 snap-start flex-col items-center gap-1.5 rounded-3xl p-3.5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-40">
      <Link
        href={`/u/${user.username}`}
        // Stop the drag-to-scroll carousel from ever seeing this as the
        // start of a drag, so a plain click always reaches the link/button
        // untouched — see suggested-users-carousel.tsx's handlePointerDown.
        onPointerDown={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-1.5"
      >
        <div className="h-14 w-14 overflow-hidden rounded-full bg-brand-500/10 ring-2 ring-transparent transition group-hover:ring-brand-400/50">
          {user.avatar_url && (
            <Image src={user.avatar_url} alt="" width={56} height={56} className="h-full w-full object-cover" />
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

      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 flex w-full justify-center"
      >
        <FollowButton
          targetUserId={user.id}
          initialIsFollowing={false}
          isAuthenticated
          isOwnProfile={false}
        />
      </div>
    </div>
  );
}
