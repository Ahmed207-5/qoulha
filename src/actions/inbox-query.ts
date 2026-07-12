'use server';

import { createClient } from '@/lib/supabase/server';
import type { InboxMessage, MessageCategory, MessageMood, Reply } from '@/types/domain';

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

interface InboxRow {
  id: string;
  recipient_id: string;
  content: string;
  category: MessageCategory;
  mood: MessageMood;
  is_read: boolean;
  is_favorited: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  replies: Reply | Reply[] | null;
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
      'id, recipient_id, content, category, mood, is_read, is_favorited, is_published, published_at, created_at, replies(id, message_id, author_id, content, created_at, updated_at)',
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

  if (error || !data) return { messages: [], totalCount: 0 };

  const messages: InboxMessage[] = (data as unknown as InboxRow[]).map((row) => ({
    id: row.id,
    recipient_id: row.recipient_id,
    content: row.content,
    category: row.category,
    mood: row.mood,
    is_read: row.is_read,
    is_favorited: row.is_favorited,
    is_published: row.is_published,
    published_at: row.published_at,
    created_at: row.created_at,
    reply: Array.isArray(row.replies) ? (row.replies[0] ?? null) : row.replies,
  }));

  return { messages, totalCount: count ?? 0 };
}
