'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { onboardingSchema } from '@/lib/validations/auth';
import { checkUsernameAvailable } from './onboarding';
import { redirect } from 'next/navigation';
import type { ActionResult } from './auth';

export async function updateProfileAction(formData: unknown): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.')] = issue.message;
    return { success: false, fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  const { data: current } = await supabase.from('profiles').select('username').eq('id', user.id).single();
  if (current?.username !== parsed.data.username) {
    const available = await checkUsernameAvailable(parsed.data.username);
    if (!available) return { success: false, fieldErrors: { username: 'اسم المستخدم ده متحجز' } };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username: parsed.data.username,
      full_name: parsed.data.fullName,
      bio: parsed.data.bio,
      avatar_url: parsed.data.avatarUrl,
    })
    .eq('id', user.id);

  if (error) return { success: false, error: 'حدث خطأ أثناء الحفظ' };
  return { success: true };
}

/**
 * Saves the public URL of an avatar the client already uploaded directly
 * to the "avatars" Storage bucket. Kept separate from updateProfileAction
 * so a picture change never has to pass through username/bio validation.
 * The upload itself was already scoped to the caller's own
 * `{user_id}/...` folder by Storage RLS (0003_storage.sql); this just
 * double-checks the saved URL actually points there before writing it, so
 * this action can't be used to set an arbitrary avatar_url.
 */
export async function updateAvatarUrlAction(avatarUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  if (!avatarUrl.includes(`/avatars/${user.id}/`)) {
    return { success: false, error: 'الصورة غير صالحة' };
  }

  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
  if (updateError) return { success: false, error: 'حدث خطأ أثناء حفظ الصورة' };
  return { success: true };
}

export async function updateSettingsAction(settings: {
  allowMessages: boolean;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  const { error } = await supabase
    .from('user_settings')
    .update({
      allow_messages: settings.allowMessages,
      email_notifications: settings.emailNotifications,
      theme: settings.theme,
    })
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'حدث خطأ أثناء الحفظ' };
  return { success: true };
}

export async function changePasswordAction(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 8) {
    return { success: false, fieldErrors: { password: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' } };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: 'حدث خطأ أثناء تغيير كلمة المرور' };
  return { success: true };
}

export async function exportMessagesAction(): Promise<{ data: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'الجلسة انتهت' };

  const { data } = await supabase
    .from('messages')
    .select('content, category, mood, created_at, is_published')
    .eq('recipient_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return { data: JSON.stringify(data ?? [], null, 2) };
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  // Deleting the auth.users row cascades to profiles (and everything keyed
  // off it) via the ON DELETE CASCADE foreign keys in the schema.
  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) return { success: false, error: 'حدث خطأ أثناء حذف الحساب' };

  await supabase.auth.signOut();
  redirect('/');
}
