'use server';

import { createClient } from '@/lib/supabase/server';
import { checkFollowRateLimit } from '@/lib/rate-limit';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';

export async function toggleFollowAction(targetUserId: string, follow: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك عشان تتابع' };

  if (user.id === targetUserId) {
    return { success: false, error: 'مينفعش تتابع نفسك' };
  }

  const headerList = await headers();
  const fingerprint = computeFingerprint({
    ip: getRequestIp(headerList),
    userAgent: headerList.get('user-agent') ?? 'unknown',
    userId: user.id,
  });
  const rateLimitResult = await checkFollowRateLimit(fingerprint);
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'حصل نشاط كتير على السريع، خد نفسك شوية' };
  }

  if (follow) {
    const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    // Unique-violation just means they're already following — idempotent no-op.
    if (error && error.code !== '23505') return { success: false, error: 'حدث خطأ' };
  } else {
    const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
    if (error) return { success: false, error: 'حدث خطأ' };
  }

  revalidatePath('/u');
  return { success: true };
}
