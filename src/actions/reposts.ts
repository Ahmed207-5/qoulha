'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRepostRateLimit } from '@/lib/rate-limit';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';

/**
 * Reposts (or un-reposts) a published message to the caller's own profile.
 * The repost is a reference row only — original authorship is never
 * duplicated or reassigned, it's always resolved live from the original
 * message's recipient.
 */
export async function toggleRepostAction(messageId: string, repost: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك عشان تعمل ريبوست' };

  if (repost) {
    const headerList = await headers();
    const fingerprint = computeFingerprint({
      ip: getRequestIp(headerList),
      userAgent: headerList.get('user-agent') ?? 'unknown',
      userId: user.id,
    });
    const rateLimitResult = await checkRepostRateLimit(fingerprint);
    if (!rateLimitResult.allowed) {
      return { success: false, error: 'عملت ريبوست كتير على السريع، خد نفسك شوية' };
    }

    const { error } = await supabase.from('reposts').insert({ original_message_id: messageId, reposted_by: user.id });
    // Unique-violation just means they'd already reposted it — treat as a
    // successful no-op rather than surfacing a confusing error.
    if (error && error.code !== '23505') return { success: false, error: 'حدث خطأ' };
  } else {
    const { data, error } = await supabase
      .from('reposts')
      .delete()
      .eq('original_message_id', messageId)
      .eq('reposted_by', user.id)
      .select('id');
    if (error) return { success: false, error: 'حدث خطأ' };
    // Zero rows here just means there was nothing to un-repost (not an
    // error) — this path is always scoped to the caller's own row.
    void data;
  }

  revalidatePath('/wall');
  revalidatePath(`/m/${messageId}`);
  return { success: true };
}

/**
 * Admin-only removal of someone else's repost. Own-repost removal should
 * go through toggleRepostAction instead; this exists for the message
 * detail page's "reposted by" moderation list. RLS still enforces that only
 * the repost owner or an admin can succeed here.
 */
export async function deleteRepostAdminAction(repostId: string, messageId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  // .select() distinguishes "RLS silently blocked this" (empty array, no
  // error) from a genuine success — without it, a non-admin/non-owner
  // calling this action would see success:true despite nothing happening.
  const { data, error } = await supabase.from('reposts').delete().eq('id', repostId).select('id');
  if (error || !data || data.length === 0) {
    return { success: false, error: 'مش مسموحلك بحذف الريبوست ده' };
  }

  revalidatePath('/wall');
  revalidatePath(`/m/${messageId}`);
  return { success: true };
}
