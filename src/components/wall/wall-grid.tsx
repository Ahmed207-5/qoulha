'use client';

import * as React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getWallMessagesAction } from '@/services/wall-service';
import { WallMessageCard } from './wall-message-card';
import { useInfiniteScrollTrigger } from '@/hooks/use-infinite-scroll-trigger';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Input } from '@/components/ui/form-elements';
import { Search, Loader2 } from 'lucide-react';

export function WallGrid() {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['wall', debouncedSearch],
    queryFn: ({ pageParam }) => getWallMessagesAction({ cursor: pageParam, search: debouncedSearch }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const triggerRef = useInfiniteScrollTrigger(() => fetchNextPage(), !!hasNextPage && !isFetchingNextPage);
  const messages = data?.pages.flatMap((p) => p.messages) ?? [];

  return (
    <div className="space-y-6">
      <div className="relative mx-auto max-w-md">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
        <Input
          placeholder="دور في الحائط العام..."
          className="pr-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-48 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : messages.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {messages.map((msg) => (
              <WallMessageCard key={msg.id} message={msg} />
            ))}
          </div>
          <div ref={triggerRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-brand-400" />}
          </div>
        </>
      ) : (
        <div className="glass rounded-3xl p-12 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
          مفيش رسائل منشورة لسه
        </div>
      )}
    </div>
  );
}
