'use server';

import { createClient } from '@/lib/supabase/server';
import { checkReactionRateLimit } from '@/lib/rate-limit';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';
import type { ReactionEmoji } from '@/types/domain';

const VALID_EMOJIS: ReactionEmoji[] = ['❤️', '😂', '🥺', '👏', '🔥'];

/**
 * Sets (or clears, when emoji is null) the caller's single reaction on a
 * message. One reaction per user is enforced by the unique(message_id,
 * user_id) constraint on message_reactions (0007_message_reactions.sql) —
 * this upserts the row rather than inserting a new one per emoji, which is
 * what makes "allow changing reaction" work without duplicate rows.
 */
export async function setReactionAction(messageId: string, emoji: ReactionEmoji | null): Promise<ActionResult> {
  if (emoji !== null && !VALID_EMOJIS.includes(emoji)) {
    return { success: false, error: 'رياكشن غير مدعوم' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك عشان تتفاعل' };

  const headerList = await headers();
  const fingerprint = computeFingerprint({
    ip: getRequestIp(headerList),
    userAgent: headerList.get('user-agent') ?? 'unknown',
    userId: user.id,
  });
  const rateLimitResult = await checkReactionRateLimit(fingerprint);
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'تفاعلت كتير على السريع، خد نفسك شوية' };
  }

  if (emoji === null) {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);
    if (error) return { success: false, error: 'حدث خطأ' };
  } else {
    const { error } = await supabase
      .from('message_reactions')
      .upsert({ message_id: messageId, user_id: user.id, emoji }, { onConflict: 'message_id,user_id' });
    if (error) return { success: false, error: 'حدث خطأ' };
  }

  revalidatePath('/wall');
  revalidatePath(`/m/${messageId}`);
  return { success: true };
}
