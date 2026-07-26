'use client';

import * as React from 'react';
import { ChevronLeft } from 'lucide-react';
import { getSuggestedUsers } from '@/services/suggested-users-service';
import { SuggestedUserCard } from './suggested-user-card';
import type { SuggestedUser } from '@/types/domain';

const SKELETON_COUNT = 4;

export function SuggestedUsersCarousel({
  initialUsers,
  pageSize = 10,
  showMoreButton = false,
}: {
  initialUsers: SuggestedUser[];
  /** Batch size for each subsequent "load more" fetch. Defaults to 10 — the Wall's existing behavior, unchanged. */
  pageSize?: number;
  /** Profile page's compact carousel wants an explicit "عرض المزيد" trigger in addition to the scroll-to-end auto-load. */
  showMoreButton?: boolean;
}) {
  const [users, setUsers] = React.useState(initialUsers);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [exhausted, setExhausted] = React.useState(initialUsers.length === 0);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);
  const dragStartRef = React.useRef({ x: 0, scrollLeft: 0 });
  const usersRef = React.useRef(users);
  usersRef.current = users;
  const loadingRef = React.useRef(false);

  const loadMore = React.useCallback(async () => {
    if (loadingRef.current || exhausted) return;
    loadingRef.current = true;
    setLoadingMore(true);
    const more = await getSuggestedUsers(usersRef.current.map((u) => u.id), pageSize);
    loadingRef.current = false;
    setLoadingMore(false);
    if (more.length === 0) {
      setExhausted(true);
    } else {
      setUsers((prev) => [...prev, ...more]);
    }
  }, [exhausted, pageSize]);

  // Infinite lazy loading: fetch more once the end-of-list sentinel scrolls into view.
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    const scroller = scrollerRef.current;
    if (!sentinel || !scroller || exhausted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: scroller, threshold: 0.5 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, exhausted]);

  // Mouse wheel / trackpad: convert vertical scroll into horizontal movement.
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already scrolling horizontally — let it through
    e.preventDefault();
    e.currentTarget.scrollLeft += e.deltaY;
  }

  // Click-and-drag scroll on desktop only — touch keeps native swipe/snap.
  // Interactive elements inside each card (the avatar/name link, the Follow
  // button) stop this event from bubbling here at all — see
  // suggested-user-card.tsx — so a plain click on them is never mistaken
  // for the start of a drag.
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, scrollLeft: e.currentTarget.scrollLeft };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    e.currentTarget.scrollLeft = dragStartRef.current.scrollLeft + (dragStartRef.current.x - e.clientX);
  }
  function stopDragging() {
    draggingRef.current = false;
  }

  if (users.length === 0 && !loadingMore) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-brand-950 dark:text-white">✨ قد تعرفهم</h2>
        {showMoreButton && !exhausted && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-0.5 text-xs font-semibold text-brand-500 hover:underline disabled:opacity-50"
          >
            عرض المزيد
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div
        ref={scrollerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
        className="no-scrollbar flex snap-x snap-mandatory cursor-grab gap-3 overflow-x-auto scroll-smooth pb-2 active:cursor-grabbing"
      >
        {users.map((user) => (
          <SuggestedUserCard key={user.id} user={user} />
        ))}
        {loadingMore &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={`skeleton-${i}`} className="glass h-48 w-36 shrink-0 animate-pulse rounded-3xl sm:w-40" />
          ))}
        {!exhausted && <div ref={sentinelRef} className="w-px shrink-0" aria-hidden />}
      </div>
    </section>
  );
}
