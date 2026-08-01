'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';
import type { ReportStatus, DailyPost } from '@/types/domain';
import { createDailyPostSchema, type CreateDailyPostInput } from '@/lib/validations/daily-space';

async function assertIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'الجلسة انتهت' } as const;

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return { error: 'صلاحيات غير كافية' } as const;
  return { userId: user.id } as const;
}

export async function suspendUserAction(userId: string, suspended: boolean): Promise<ActionResult> {
  const admin = await assertIsAdmin();
  if ('error' in admin) return { success: false, error: admin.error };

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', userId);
  if (error) return { success: false, error: 'حدث خطأ' };

  await supabase.from('activity_logs').insert({
    user_id: admin.userId,
    action: suspended ? 'report_actioned' : 'report_actioned',
    metadata: { target_user: userId, action: suspended ? 'suspend' : 'unsuspend' },
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateReportStatusAction(reportId: string, status: ReportStatus): Promise<ActionResult> {
  const admin = await assertIsAdmin();
  if ('error' in admin) return { success: false, error: admin.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('reports')
    .update({ status, reviewed_by: admin.userId, reviewed_at: new Date().toISOString() })
    .eq('id', reportId);

  if (error) return { success: false, error: 'حدث خطأ' };
  revalidatePath('/admin/reports');
  return { success: true };
}

export async function deleteReportedMessageAction(messageId: string, reportId: string): Promise<ActionResult> {
  const admin = await assertIsAdmin();
  if ('error' in admin) return { success: false, error: admin.error };

  const supabase = await createClient();

  // .select() lets us confirm the update actually affected the message,
  // rather than silently reporting success while the reported message
  // stayed exactly as it was (see 0013_fix_admin_message_moderation.sql —
  // this update previously always matched zero rows).
  const { data, error } = await supabase
    .from('messages')
    .update({ is_deleted: true, is_published: false })
    .eq('id', messageId)
    .select('id');

  if (error || !data || data.length === 0) {
    return { success: false, error: 'تعذر حذف الرسالة المُبلّغ عنها' };
  }

  const { error: reportError } = await supabase
    .from('reports')
    .update({ status: 'actioned', reviewed_by: admin.userId, reviewed_at: new Date().toISOString() })
    .eq('id', reportId);

  if (reportError) return { success: false, error: 'اتحذفت الرسالة لكن حصل خطأ في تحديث حالة البلاغ' };

  revalidatePath('/admin/reports');
  return { success: true };
}

// ---------- Today's Space (0026_daily_space.sql) ----------

export interface CreateDailyPostActionResult extends ActionResult {
  post?: DailyPost;
}

/**
 * Publishes a new daily post for Today's Space. Any currently active post
 * is archived automatically, atomically, inside admin_create_daily_post()
 * (SECURITY DEFINER) — never done as two separate client round-trips,
 * which could otherwise race or leave zero/two active posts momentarily.
 */
export async function createDailyPostAction(input: CreateDailyPostInput): Promise<CreateDailyPostActionResult> {
  const parsed = createDailyPostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  }

  const admin = await assertIsAdmin();
  if ('error' in admin) return { success: false, error: admin.error };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_create_daily_post', {
    p_type: parsed.data.type,
    p_title: parsed.data.title ?? null,
    p_content: parsed.data.content,
  });

  if (error || !data) return { success: false, error: 'حدث خطأ أثناء نشر منشور اليوم' };

  revalidatePath('/wall');
  revalidatePath('/admin/daily-space');
  return { success: true, post: data as DailyPost };
}

/** Manually ends the current daily post early, without publishing a replacement. */
export async function archiveDailyPostAction(dailyPostId: string): Promise<ActionResult> {
  const admin = await assertIsAdmin();
  if ('error' in admin) return { success: false, error: admin.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_archive_daily_post', { p_id: dailyPostId });
  if (error) return { success: false, error: 'حدث خطأ' };

  revalidatePath('/wall');
  revalidatePath('/admin/daily-space');
  return { success: true };
}
