'use server';

import { createClient } from '@/lib/supabase/server';
import { commentSchema } from '@/lib/validations/message';
import { containsProfanity, cleanForStorage } from '@/lib/profanity-filter';
import { checkCommentRateLimit } from '@/lib/rate-limit';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Comment } from '@/types/domain';

export interface CommentsPage {
  comments: Comment[];
  nextCursor: string | null;
}

export interface CommentActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  comment?: Comment;
}

interface CommentRow {
  id: string;
  message_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: Comment['author'] | Comment['author'][];
}

function normalizeCommentRow(row: CommentRow): Comment {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    message_id: row.message_id,
    author_id: row.author_id,
    content: row.content,
    created_at: row.created_at,
    author: author ?? { username: '', full_name: 'مستخدم محذوف', avatar_url: null },
  };
}

/** Newest-first, cursor-paginated — mirrors the keyset pattern used in wall-service.ts. */
export async function getCommentsAction(messageId: string, cursor?: string, pageSize = 10): Promise<CommentsPage> {
  const supabase = await createClient();

  let q = supabase
    .from('comments')
    .select(
      'id, message_id, author_id, content, created_at, author:profiles!comments_author_id_fkey(username, full_name, avatar_url)'
    )
    .eq('message_id', messageId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (cursor) q = q.lt('created_at', cursor);

  const { data, error } = await q;
  if (error || !data) return { comments: [], nextCursor: null };

  const comments = (data as unknown as CommentRow[]).map(normalizeCommentRow);
  const last = comments[comments.length - 1];
  const nextCursor = comments.length === pageSize && last ? last.created_at : null;
  return { comments, nextCursor };
}

export async function createCommentAction(formData: unknown): Promise<CommentActionResult> {
  const parsed = commentSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.')] = issue.message;
    return { success: false, fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك عشان تعلّق' };

  const headerList = await headers();
  const fingerprint = computeFingerprint({
    ip: getRequestIp(headerList),
    userAgent: headerList.get('user-agent') ?? 'unknown',
    userId: user.id,
  });
  const rateLimitResult = await checkCommentRateLimit(fingerprint);
  if (!rateLimitResult.allowed) {
    return { success: false, error: `علّقت كتير على السريع، جرّب تاني بعد ${rateLimitResult.retryAfterSeconds} ثانية` };
  }

  const cleaned = cleanForStorage(parsed.data.content);
  if (containsProfanity(cleaned)) {
    return { success: false, error: 'التعليق فيه ألفاظ غير مسموح بيها' };
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ message_id: parsed.data.messageId, author_id: user.id, content: cleaned })
    .select(
      'id, message_id, author_id, content, created_at, author:profiles!comments_author_id_fkey(username, full_name, avatar_url)'
    )
    .single();

  if (error || !data) return { success: false, error: 'حدث خطأ أثناء إرسال التعليق' };

  revalidatePath(`/m/${parsed.data.messageId}`);
  return { success: true, comment: normalizeCommentRow(data as unknown as CommentRow) };
}

/**
 * Soft-deletes a comment. RLS (0006_comments.sql) only allows this UPDATE to
 * succeed if the caller is the comment's author OR an admin — this action
 * doesn't need to branch on that itself.
 */
export async function deleteCommentAction(commentId: string, messageId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  // .select() lets us tell "RLS silently blocked this" (empty array, no
  // error) apart from a genuine success — without it, an unauthorized
  // delete attempt would report success:true despite affecting zero rows.
  const { data, error } = await supabase.from('comments').update({ is_deleted: true }).eq('id', commentId).select('id');
  if (error || !data || data.length === 0) {
    return { success: false, error: 'مش مسموحلك بحذف التعليق ده' };
  }

  revalidatePath(`/m/${messageId}`);
  return { success: true };
}
