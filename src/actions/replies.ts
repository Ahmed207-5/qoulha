'use server';

import { createClient } from '@/lib/supabase/server';
import { replySchema } from '@/lib/validations/message';
import { containsProfanity, cleanForStorage } from '@/lib/profanity-filter';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './auth';

/**
 * Creates or edits the caller's official reply to a message they received.
 * "Reply can be edited" is implemented as an upsert on the unique
 * `message_id` column — resubmitting simply overwrites the existing reply.
 * Permissions (recipient-only, message must be published) are enforced by
 * RLS in 0005_replies.sql; this action re-checks ownership up front purely
 * to return a friendly error instead of a generic database failure.
 */
export async function upsertReplyAction(formData: unknown): Promise<ActionResult> {
  const parsed = replySchema.safeParse(formData);
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

  const { data: message } = await supabase
    .from('messages')
    .select('recipient_id, is_published')
    .eq('id', parsed.data.messageId)
    .single();

  if (!message || message.recipient_id !== user.id) {
    return { success: false, error: 'مش مسموحلك بالرد على الرسالة دي' };
  }
  if (!message.is_published) {
    return { success: false, error: 'لازم تنشر الرسالة الأول عشان تقدر ترد عليها' };
  }

  const cleaned = cleanForStorage(parsed.data.content);
  if (containsProfanity(cleaned)) {
    return { success: false, error: 'ردك فيه ألفاظ غير مسموح بيها' };
  }

  const { error } = await supabase
    .from('replies')
    .upsert({ message_id: parsed.data.messageId, author_id: user.id, content: cleaned }, { onConflict: 'message_id' });

  if (error) return { success: false, error: 'حدث خطأ أثناء حفظ الرد' };

  revalidatePath('/wall');
  revalidatePath('/inbox');
  revalidatePath('/dashboard');
  revalidatePath(`/m/${parsed.data.messageId}`);
  return { success: true };
}

export async function deleteReplyAction(messageId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'الجلسة انتهت' };

  const { data, error } = await supabase
    .from('replies')
    .delete()
    .eq('message_id', messageId)
    .eq('author_id', user.id)
    .select('id');
  if (error || !data || data.length === 0) return { success: false, error: 'حدث خطأ' };

  revalidatePath('/wall');
  revalidatePath('/inbox');
  revalidatePath('/dashboard');
  revalidatePath(`/m/${messageId}`);
  return { success: true };
}
