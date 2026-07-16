'use server';

import { createClient } from '@/lib/supabase/server';
import { onboardingSchema } from '@/lib/validations/auth';
import type { ActionResult } from './auth';

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  return !data;
}

/**
 * When a username is taken, suggests up to 3 available alternatives
 * (numeric suffixes + underscore variant) rather than leaving the user to
 * guess. Checks candidates in a single batched query instead of one
 * round-trip per guess.
 */
export async function suggestUsernameAlternatives(username: string): Promise<string[]> {
  const base = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!base) return [];

  const candidates = [
    `${base}_`,
    `${base}${Math.floor(Math.random() * 90 + 10)}`,
    `${base}${Math.floor(Math.random() * 900 + 100)}`,
    `${base}_${Math.floor(Math.random() * 90 + 10)}`,
    `the_${base}`,
  ].filter((c) => c.length >= 3 && c.length <= 20);

  const supabase = await createClient();
  const { data: taken } = await supabase.from('profiles').select('username').in('username', candidates);
  const takenSet = new Set((taken ?? []).map((r) => r.username));

  return candidates.filter((c) => !takenSet.has(c)).slice(0, 3);
}

export async function completeOnboardingAction(formData: unknown): Promise<ActionResult> {
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

  if (!user) {
    return { success: false, error: 'الجلسة انتهت، سجّل دخولك تاني' };
  }

  const available = await checkUsernameAvailable(parsed.data.username);
  if (!available) {
    return { success: false, fieldErrors: { username: 'اسم المستخدم ده متحجز، جرّب واحد تاني' } };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username: parsed.data.username,
      full_name: parsed.data.fullName,
      bio: parsed.data.bio,
      avatar_url: parsed.data.avatarUrl,
      onboarding_completed: true,
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'حدث خطأ أثناء حفظ البيانات' };
  }

  return { success: true };
}

export async function uploadAvatarAction(file: File): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'الجلسة انتهت' };

  const MAX_BYTES = 3 * 1024 * 1024;
  if (file.size > MAX_BYTES) return { error: 'حجم الصورة أكبر من 3 ميجا' };
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return { error: 'صيغة الصورة غير مدعومة' };
  }

  const ext = file.type.split('/')[1];
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: 'فشل رفع الصورة' };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl };
}
