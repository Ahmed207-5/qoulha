'use server';

import { createClient } from '@/lib/supabase/server';
import { reportMessageSchema } from '@/lib/validations/message';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';

async function assertOwnsMessage(messageId: string): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'الجلسة انتهت' };

  const { data: message } = await supabase
    .from('messages')
    .select('recipient_id')
    .eq('id', messageId)
    .single();

  if (!message || message.recipient_id !== user.id) {
    return { error: 'مش مسموحلك بالتعديل على الرسالة دي' };
  }

  return { userId: user.id };
}

export async function markMessageReadAction(messageId: string): Promise<ActionResult> {
  const owner = await assertOwnsMessage(messageId);
  if ('error' in owner) return { success: false, error: owner.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .eq('recipient_id', owner.userId);

  if (error) return { success: false, error: 'حدث خطأ' };
  revalidatePath('/inbox');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleFavoriteAction(messageId: string, favorited: boolean): Promise<ActionResult> {
  const owner = await assertOwnsMessage(messageId);
  if ('error' in owner) return { success: false, error: owner.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('messages')
    .update({ is_favorited: favorited })
    .eq('id', messageId)
    .eq('recipient_id', owner.userId);

  if (error) return { success: false, error: 'حدث خطأ' };
  revalidatePath('/inbox');
  return { success: true };
}

export async function togglePublishAction(messageId: string, published: boolean): Promise<ActionResult> {
  const owner = await assertOwnsMessage(messageId);
  if ('error' in owner) return { success: false, error: owner.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('messages')
    .update({ is_published: published, published_at: published ? new Date().toISOString() : null })
    .eq('id', messageId)
    .eq('recipient_id', owner.userId);

  if (error) return { success: false, error: 'حدث خطأ' };
  revalidatePath('/inbox');
  revalidatePath('/wall');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteMessageAction(messageId: string): Promise<ActionResult> {
  const owner = await assertOwnsMessage(messageId);
  if ('error' in owner) return { success: false, error: owner.error };

  const supabase = await createClient();
  // Soft delete — preserves the row for moderation/report history
  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId)
    .eq('recipient_id', owner.userId);

  if (error) return { success: false, error: 'حدث خطأ' };
  revalidatePath('/inbox');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function reportMessageAction(formData: unknown): Promise<ActionResult> {
  const parsed = reportMessageSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.')] = issue.message;
    return { success: false, fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك الأول' };

  const { error } = await supabase.from('reports').insert({
    message_id: parsed.data.messageId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  if (error) return { success: false, error: 'حدث خطأ أثناء الإبلاغ' };
  return { success: true };
}
