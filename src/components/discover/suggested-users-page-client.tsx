'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/form-elements';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { searchUsers } from '@/services/search-service';
import { SuggestedUsersGrid } from './suggested-users-grid';
import type { SuggestedUser } from '@/types/domain';

export function SuggestedUsersPageClient({ initialUsers }: { initialUsers: SuggestedUser[] }) {
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const isSearching = debouncedQuery.trim().length >= 2;

  const { data: results, isLoading } = useQuery({
    queryKey: ['suggested-users-search', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery, 20),
    enabled: isSearching,
  });

  return (
    <div>
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500/50" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="دور بالاسم أو @اليوزرنيم..."
          className="pr-11"
        />
      </div>

      {isSearching ? (
        isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass h-16 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div className="space-y-2">
            {results.map((u) => (
              <Link key={u.id} href={`/u/${u.username}`} className="glass flex items-center gap-3 rounded-2xl p-4">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-500/10">
                  {u.avatar_url && (
                    <Image src={u.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950 dark:text-white">{u.full_name}</p>
                  <p className="truncate text-xs text-brand-500" dir="ltr">@{u.username}</p>
                </div>
                <span className="text-xs text-brand-500/60">{u.message_count} رسالة</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70 dark:text-brand-200/70">
            مفيش نتايج
          </div>
        )
      ) : (
        <SuggestedUsersGrid initialUsers={initialUsers} />
      )}
    </div>
  );
}
