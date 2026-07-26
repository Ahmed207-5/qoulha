'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { getSuggestedUsers } from '@/services/suggested-users-service';
import { SuggestedUserCard } from '@/components/wall/suggested-user-card';
import type { SuggestedUser } from '@/types/domain';

const PAGE_SIZE = 10;
const SKELETON_COUNT = 10;

export function SuggestedUsersGrid({ initialUsers }: { initialUsers: SuggestedUser[] }) {
  const [users, setUsers] = React.useState(initialUsers);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [exhausted, setExhausted] = React.useState(initialUsers.length === 0);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const usersRef = React.useRef(users);
  usersRef.current = users;
  const loadingRef = React.useRef(false);

  const loadMore = React.useCallback(async () => {
    if (loadingRef.current || exhausted) return;
    loadingRef.current = true;
    setLoadingMore(true);
    const more = await getSuggestedUsers(usersRef.current.map((u) => u.id), PAGE_SIZE);
    loadingRef.current = false;
    setLoadingMore(false);
    if (more.length === 0) {
      setExhausted(true);
    } else {
      setUsers((prev) => [...prev, ...more]);
    }
  }, [exhausted]);

  // Infinite scroll: only fetch more once the page has actually scrolled
  // near the end of the current list (rootMargin gives it a head start).
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || exhausted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, exhausted]);

  if (users.length === 0 && !loadingMore) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
        <Users className="h-8 w-8 text-brand-500/50" />
        <p className="text-sm text-brand-700/70 dark:text-brand-200/70">
          مفيش اقتراحات دلوقتي — جرب تاني بعدين
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {users.map((user) => (
          <SuggestedUserCard key={user.id} user={user} />
        ))}
        {loadingMore &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={`skeleton-${i}`} className="glass h-48 animate-pulse rounded-3xl" />
          ))}
      </div>
      {!exhausted && <div ref={sentinelRef} className="h-1" aria-hidden />}
    </div>
  );
}
