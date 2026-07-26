'use client';

import * as React from 'react';
import { getSuggestedUsers } from '@/services/suggested-users-service';
import { SuggestedUserCard } from './suggested-user-card';
import type { SuggestedUser } from '@/types/domain';

const SKELETON_COUNT = 4;

export function SuggestedUsersCarousel({ initialUsers }: { initialUsers: SuggestedUser[] }) {
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
    const more = await getSuggestedUsers(usersRef.current.map((u) => u.id), 10);
    loadingRef.current = false;
    setLoadingMore(false);
    if (more.length === 0) {
      setExhausted(true);
    } else {
      setUsers((prev) => [...prev, ...more]);
    }
  }, [exhausted]);

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

  function handleFollowed(userId: string) {
    // Small delay so the button's own success state is visible for a beat
    // before the card leaves — a followed person is no longer a "suggestion".
    setTimeout(() => setUsers((prev) => prev.filter((u) => u.id !== userId)), 600);
  }

  if (users.length === 0 && !loadingMore) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-lg font-bold text-brand-950 dark:text-white">✨ قد تعرفهم</h2>
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
          <SuggestedUserCard key={user.id} user={user} onFollowed={() => handleFollowed(user.id)} />
        ))}
        {loadingMore &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={`skeleton-${i}`} className="glass h-56 w-40 shrink-0 animate-pulse rounded-3xl sm:w-44" />
          ))}
        {!exhausted && <div ref={sentinelRef} className="w-px shrink-0" aria-hidden />}
      </div>
    </section>
  );
}
