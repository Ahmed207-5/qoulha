'use server';

import { createClient } from '@/lib/supabase/server';
import type { DailyPost, DailyPostReply, DailyPostSummary } from '@/types/domain';

interface DailyPostRow {
  id: string;
  type: DailyPost['type'];
  title: string | null;
  content: string;
  status: DailyPost['status'];
  published_at: string;
  archived_at: string | null;
}

interface DailyPostReplyRow {
  id: string;
  daily_post_id: string;
  author_id: string;
  parent_reply_id: string | null;
  content: string;
  created_at: string;
  author: DailyPostReply['author'] | DailyPostReply['author'][];
}

function normalizePost(row: DailyPostRow): DailyPost {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    status: row.status,
    published_at: row.published_at,
    archived_at: row.archived_at,
  };
}

/** The one currently active daily post, or null if an admin hasn't published one yet. */
export async function getActiveDailyPost(): Promise<DailyPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('daily_posts')
    .select('id, type, title, content, status, published_at, archived_at')
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return normalizePost(data as unknown as DailyPostRow);
}

export async function getDailyPostById(id: string): Promise<DailyPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('daily_posts')
    .select('id, type, title, content, status, published_at, archived_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return normalizePost(data as unknown as DailyPostRow);
}

export interface DailyPostArchivePage {
  posts: DailyPostSummary[];
  nextCursor: string | null;
}

/** Older, no-longer-active daily posts — kept viewable, newest-archived first. */
export async function getArchivedDailyPosts(cursor?: string, pageSize = 10): Promise<DailyPostArchivePage> {
  const supabase = await createClient();

  let q = supabase
    .from('daily_posts')
    .select('id, type, title, content, status, published_at, archived_at')
    .eq('status', 'archived')
    .order('archived_at', { ascending: false })
    .limit(pageSize);

  if (cursor) q = q.lt('archived_at', cursor);

  const { data, error } = await q;
  if (error || !data) return { posts: [], nextCursor: null };

  const rows = data as unknown as DailyPostRow[];
  const ids = rows.map((r) => r.id);

  const replyCountMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: replyRows } = await supabase
      .from('daily_post_replies')
      .select('daily_post_id')
      .eq('is_deleted', false)
      .in('daily_post_id', ids);
    for (const r of replyRows ?? []) {
      replyCountMap.set(r.daily_post_id, (replyCountMap.get(r.daily_post_id) ?? 0) + 1);
    }
  }

  const posts: DailyPostSummary[] = rows.map((row) => ({
    ...normalizePost(row),
    reply_count: replyCountMap.get(row.id) ?? 0,
  }));

  const last = posts[posts.length - 1];
  const nextCursor = posts.length === pageSize && last?.archived_at ? last.archived_at : null;
  return { posts, nextCursor };
}

/**
 * Every reply on a daily post, threaded into (at most) two levels:
 * top-level replies, each carrying its own `replies` (replies-to-that-
 * reply). A daily post's total conversation is expected to be a single
 * day's worth of activity, so this intentionally fetches the whole thread
 * in one go rather than paginating — same tradeoff getCommentsAction
 * makes per-message, just scoped to "per day" instead of "per message".
 */
export async function getDailyPostReplies(dailyPostId: string, viewerId?: string): Promise<DailyPostReply[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_post_replies')
    .select(
      'id, daily_post_id, author_id, parent_reply_id, content, created_at, author:profiles!daily_post_replies_author_id_fkey(username, full_name, avatar_url)'
    )
    .eq('daily_post_id', dailyPostId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error || !data) return [];

  const rows = data as unknown as DailyPostReplyRow[];
  const ids = rows.map((r) => r.id);

  const [{ data: likeRows }, { data: myLikeRows }] = await Promise.all([
    ids.length
      ? supabase.from('daily_post_reply_likes').select('reply_id').in('reply_id', ids)
      : Promise.resolve({ data: [] as { reply_id: string }[] }),
    ids.length && viewerId
      ? supabase.from('daily_post_reply_likes').select('reply_id').eq('user_id', viewerId).in('reply_id', ids)
      : Promise.resolve({ data: [] as { reply_id: string }[] }),
  ]);

  const likeCountMap = new Map<string, number>();
  for (const row of likeRows ?? []) likeCountMap.set(row.reply_id, (likeCountMap.get(row.reply_id) ?? 0) + 1);
  const myLikeSet = new Set((myLikeRows ?? []).map((r) => r.reply_id));

  function toReply(row: DailyPostReplyRow): DailyPostReply {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    return {
      id: row.id,
      daily_post_id: row.daily_post_id,
      author_id: row.author_id,
      parent_reply_id: row.parent_reply_id,
      content: row.content,
      created_at: row.created_at,
      author: author ?? { username: '', full_name: 'مستخدم محذوف', avatar_url: null },
      like_count: likeCountMap.get(row.id) ?? 0,
      liked_by_me: myLikeSet.has(row.id),
      replies: [],
    };
  }

  const byId = new Map<string, DailyPostReply>();
  const topLevel: DailyPostReply[] = [];

  for (const row of rows) {
    const reply = toReply(row);
    byId.set(reply.id, reply);
    if (!reply.parent_reply_id) topLevel.push(reply);
  }
  for (const row of rows) {
    if (row.parent_reply_id) {
      const parent = byId.get(row.parent_reply_id);
      const child = byId.get(row.id);
      if (parent && child) parent.replies.push(child);
    }
  }

  return topLevel;
}

/**
 * Whether the current user has a new daily post to see — i.e. there IS
 * an active post and it's not the one they last viewed. Two lightweight
 * point-selects (no joins, no counting), reusing getActiveDailyPost()
 * and the single-row-per-user daily_post_views table from
 * 0027_daily_space_engagement.sql.
 */
export async function getDailySpaceUnreadStatus(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const [activePost, { data: viewRow }] = await Promise.all([
    getActiveDailyPost(),
    supabase.from('daily_post_views').select('daily_post_id').eq('user_id', userId).maybeSingle(),
  ]);

  if (!activePost) return false;
  return viewRow?.daily_post_id !== activePost.id;
}
