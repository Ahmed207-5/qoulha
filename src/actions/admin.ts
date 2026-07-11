'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';
import type { ReportStatus } from '@/types/domain';

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
  await supabase.from('messages').update({ is_deleted: true, is_published: false }).eq('id', messageId);
  await supabase
    .from('reports')
    .update({ status: 'actioned', reviewed_by: admin.userId, reviewed_at: new Date().toISOString() })
    .eq('id', reportId);

  revalidatePath('/admin/reports');
  return { success: true };
}
