'use server';

import { createClient } from '@/lib/supabase/server';
import { dailyReplySchema } from '@/lib/validations/daily-space';
import { containsProfanity, cleanForStorage } from '@/lib/profanity-filter';
import { checkDailySpaceReplyRateLimit, checkReactionRateLimit } from '@/lib/rate-limit';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';
import type { DailyPostReply } from '@/types/domain';
import { getArchivedDailyPosts, getDailyPostById, getDailyPostReplies, type DailyPostArchivePage } from '@/services/daily-space-service';

export interface DailyReplyActionResult extends ActionResult {
  reply?: DailyPostReply;
}

async function getFingerprint(userId: string) {
  const headerList = await headers();
  return computeFingerprint({
    ip: getRequestIp(headerList),
    userAgent: headerList.get('user-agent') ?? 'unknown',
    userId,
  });
}

/**
 * Posts a reply on Today's Space — either a top-level public reply to the
 * daily post (parentReplyId omitted) or a reply to another user's reply
 * (parentReplyId set). Both are enforced server-side by RLS
 * (0026_daily_space.sql): only on the active post, and a top-level reply
 * is capped at one per user per post via a unique index — caught here as
 * a friendly error rather than a raw Postgres constraint message.
 */
export async function createDailyReplyAction(input: {
  dailyPostId: string;
  content: string;
  parentReplyId?: string;
}): Promise<DailyReplyActionResult> {
  const parsed = dailyReplySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك عشان تشارك برأيك' };

  const fingerprint = await getFingerprint(user.id);
  const rateLimitResult = await checkDailySpaceReplyRateLimit(fingerprint);
  if (!rateLimitResult.allowed) {
    return { success: false, error: `شاركت كتير على السريع، جرّب تاني بعد ${rateLimitResult.retryAfterSeconds} ثانية` };
  }

  const cleaned = cleanForStorage(parsed.data.content);
  if (containsProfanity(cleaned)) {
    return { success: false, error: 'الرد فيه ألفاظ غير مسموح بيها' };
  }

  const { data, error } = await supabase
    .from('daily_post_replies')
    .insert({
      daily_post_id: parsed.data.dailyPostId,
      author_id: user.id,
      parent_reply_id: parsed.data.parentReplyId ?? null,
      content: cleaned,
    })
    .select(
      'id, daily_post_id, author_id, parent_reply_id, content, created_at, author:profiles!daily_post_replies_author_id_fkey(username, full_name, avatar_url)'
    )
    .single();

  if (error || !data) {
    // Postgres unique_violation on the one-top-level-reply-per-user index.
    if (error?.code === '23505') {
      return { success: false, error: 'شاركت رأيك بالفعل على منشور اليوم ده' };
    }
    return { success: false, error: 'حدث خطأ أثناء إرسال ردك، جرّب منشور اليوم لسه نشط' };
  }

  interface ReplyRow {
    id: string;
    daily_post_id: string;
    author_id: string;
    parent_reply_id: string | null;
    content: string;
    created_at: string;
    author: DailyPostReply['author'] | DailyPostReply['author'][];
  }
  const row = data as unknown as ReplyRow;
  const author = Array.isArray(row.author) ? row.author[0] : row.author;

  revalidatePath('/wall');

  return {
    success: true,
    reply: {
      id: row.id,
      daily_post_id: row.daily_post_id,
      author_id: row.author_id,
      parent_reply_id: row.parent_reply_id,
      content: row.content,
      created_at: row.created_at,
      author: author ?? { username: '', full_name: 'مستخدم محذوف', avatar_url: null },
      like_count: 0,
      liked_by_me: false,
      replies: [],
    },
  };
}

/** Toggles the caller's like on a daily post reply. Mirrors setReactionAction's upsert-or-delete shape. */
export async function toggleDailyReplyLikeAction(replyId: string): Promise<ActionResult & { liked?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك عشان تعمل لايك' };

  const fingerprint = await getFingerprint(user.id);
  const rateLimitResult = await checkReactionRateLimit(fingerprint);
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'تفاعلت كتير على السريع، خد نفسك شوية' };
  }

  const { data: existing } = await supabase
    .from('daily_post_reply_likes')
    .select('id')
    .eq('reply_id', replyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('daily_post_reply_likes').delete().eq('id', existing.id);
    if (error) return { success: false, error: 'حدث خطأ' };
    revalidatePath('/wall');
    return { success: true, liked: false };
  }

  const { error } = await supabase.from('daily_post_reply_likes').insert({ reply_id: replyId, user_id: user.id });
  if (error) return { success: false, error: 'حدث خطأ' };
  revalidatePath('/wall');
  return { success: true, liked: true };
}

/** Fetches a page of archived (no-longer-active) daily posts, for the "Archive" browser. */
export async function getDailyPostArchiveAction(cursor?: string): Promise<DailyPostArchivePage> {
  return getArchivedDailyPosts(cursor);
}

/** Fetches one daily post (active or archived) with its full reply thread — used when opening an archived post. */
export async function getDailyPostDetailAction(dailyPostId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [post, replies] = await Promise.all([
    getDailyPostById(dailyPostId),
    getDailyPostReplies(dailyPostId, user?.id),
  ]);

  return { post, replies };
}

/**
 * Records that the current user has now seen this daily post — a single
 * upsert on their one-row daily_post_views record (see
 * 0027_daily_space_engagement.sql), never a new row per view. Called once
 * when the Today's Space page opens; the sidebar's unread dot re-checks
 * this on next render via getDailySpaceUnreadStatus().
 */
export async function markDailySpaceViewedAction(dailyPostId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  const { error } = await supabase
    .from('daily_post_views')
    .upsert({ user_id: user.id, daily_post_id: dailyPostId, viewed_at: new Date().toISOString() }, { onConflict: 'user_id' });

  if (error) return { success: false, error: 'حدث خطأ' };
  return { success: true };
}
