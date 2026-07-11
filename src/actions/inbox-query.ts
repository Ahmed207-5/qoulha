'use server';

import { createClient } from '@/lib/supabase/server';
import type { InboxMessage, MessageCategory, MessageMood } from '@/types/domain';

export interface InboxQuery {
  page: number;
  pageSize: number;
  search?: string;
  category?: MessageCategory | 'all';
  mood?: MessageMood | 'all';
  status?: 'all' | 'unread' | 'favorited' | 'published';
}

export interface InboxQueryResult {
  messages: InboxMessage[];
  totalCount: number;
}

export async function getInboxMessagesAction(query: InboxQuery): Promise<InboxQueryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { messages: [], totalCount: 0 };

  let q = supabase
    .from('messages')
    .select(
      'id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at',
      { count: 'exact' }
    )
    .eq('recipient_id', user.id)
    .eq('is_deleted', false);

  if (query.search) q = q.ilike('content', `%${query.search}%`);
  if (query.category && query.category !== 'all') q = q.eq('category', query.category);
  if (query.mood && query.mood !== 'all') q = q.eq('mood', query.mood);
  if (query.status === 'unread') q = q.eq('is_read', false);
  if (query.status === 'favorited') q = q.eq('is_favorited', true);
  if (query.status === 'published') q = q.eq('is_published', true);

  const from = query.page * query.pageSize;
  const to = from + query.pageSize - 1;

  const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);

  if (error) return { messages: [], totalCount: 0 };
  return { messages: (data ?? []) as InboxMessage[], totalCount: count ?? 0 };
}
