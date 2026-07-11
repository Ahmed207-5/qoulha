'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInboxMessagesAction } from '@/actions/inbox-query';
import { InboxFilterBar, type FilterState } from './inbox-filter-bar';
import { MessageCard } from './message-card';
import { Pagination } from '@/components/shared/pagination';
import { AnimatePresence } from 'framer-motion';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const PAGE_SIZE = 10;

export function InboxList({ userId }: { userId: string }) {
  const [filters, setFilters] = React.useState<FilterState>({
    search: '', category: 'all', mood: 'all', status: 'all',
  });
  const [page, setPage] = React.useState(0);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  React.useEffect(() => setPage(0), [debouncedSearch, filters.category, filters.mood, filters.status]);

  const { data, isLoading } = useQuery({
    queryKey: ['inbox', userId, page, debouncedSearch, filters.category, filters.mood, filters.status],
    queryFn: () =>
      getInboxMessagesAction({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        category: filters.category,
        mood: filters.mood,
        status: filters.status,
      }),
  });

  return (
    <div className="space-y-5">
      <InboxFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass h-32 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : data && data.messages.length > 0 ? (
        <>
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {data.messages.map((msg) => (
                <MessageCard key={msg.id} message={msg} />
              ))}
            </div>
          </AnimatePresence>
          <Pagination page={page} pageSize={PAGE_SIZE} totalCount={data.totalCount} onPageChange={setPage} />
        </>
      ) : (
        <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
          مفيش رسائل تطابق البحث ده
        </div>
      )}
    </div>
  );
}
