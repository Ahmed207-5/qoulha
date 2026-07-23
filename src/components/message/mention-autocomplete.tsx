'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/services/search-service';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export function MentionAutocomplete({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (username: string) => void;
}) {
  const debouncedQuery = useDebouncedValue(query, 350);

  const { data: users } = useQuery({
    queryKey: ['mention-users', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery, 6),
    enabled: debouncedQuery.length >= 1,
  });

  if (!users || users.length === 0) return null;

  return (
    <div className="glass absolute bottom-full z-20 mb-1 max-h-56 w-64 overflow-y-auto rounded-2xl p-1.5 shadow-lg">
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          // onMouseDown (not onClick) so this fires before the textarea's
          // onBlur would otherwise close the dropdown first.
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(u.username);
          }}
          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-right hover:bg-brand-500/10"
        >
          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-brand-500/10">
            {u.avatar_url && (
              <Image src={u.avatar_url} alt="" width={28} height={28} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-brand-950 dark:text-white">{u.full_name}</p>
            <p className="truncate text-[11px] text-brand-500/70">@{u.username}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
