'use server';

import { createClient } from '@/lib/supabase/server';
import { conversationMessageSchema } from '@/lib/validations/message';
import { containsProfanity, cleanForStorage } from '@/lib/profanity-filter';
import { checkConversationRateLimit } from '@/lib/rate-limit';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { MAX_CONVERSATION_MESSAGES_PER_SIDE, CONVERSATION_LIMIT_REACHED_TEXT } from '@/constants/message';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ConversationMessage, ConversationSenderRole } from '@/types/domain';
import { dispatchPushForNewNotifications } from '@/lib/push-dispatch';

export interface ConversationActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: ConversationMessage;
}

/**
 * Sends the next message in a message's conversation thread. Replaces
 * upsertReplyAction (Milestone 1) — this is an append-only thread, not an
 * editable single reply, so there is no companion "delete/edit" action.
 *
 * The caller's role (owner vs. original anonymous sender) is always
 * resolved server-side from who they're authenticated as — never taken
 * from the client — so a participant can't spoof which side they post as.
 * Per-side 10-message caps are enforced twice: here (for a friendly Arabic
 * error instead of a raw RLS failure) and again by the database policies
 * in 0025_conversation_messages.sql, which are the real guarantee.
 */
export async function sendConversationMessageAction(formData: unknown): Promise<ConversationActionResult> {
  const parsed = conversationMessageSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.')] = issue.message;
    return { success: false, fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'لازم تسجل دخولك عشان تكمل المحادثة' };

  const { data: message } = await supabase
    .from('messages')
    .select('recipient_id')
    .eq('id', parsed.data.messageId)
    .maybeSingle();
  if (!message) return { success: false, error: 'الرسالة مش موجودة' };

  let role: ConversationSenderRole | null = null;
  if (message.recipient_id === user.id) {
    role = 'owner';
  } else {
    const { data: isSender } = await supabase.rpc('is_message_sender', { p_message_id: parsed.data.messageId });
    if (isSender) role = 'anonymous';
  }
  if (!role) return { success: false, error: 'مش مسموحلك تشارك في المحادثة دي' };

  const headerList = await headers();
  const fingerprint = computeFingerprint({
    ip: getRequestIp(headerList),
    userAgent: headerList.get('user-agent') ?? 'unknown',
    userId: user.id,
  });
  const rateLimitResult = await checkConversationRateLimit(fingerprint);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: `بعتت رسايل كتير على السريع، جرّب تاني بعد ${rateLimitResult.retryAfterSeconds} ثانية`,
    };
  }

  const { count } = await supabase
    .from('conversation_messages')
    .select('id', { count: 'exact', head: true })
    .eq('message_id', parsed.data.messageId)
    .eq('sender_role', role);
  if ((count ?? 0) >= MAX_CONVERSATION_MESSAGES_PER_SIDE) {
    return { success: false, error: CONVERSATION_LIMIT_REACHED_TEXT };
  }

  const cleaned = cleanForStorage(parsed.data.content);
  if (containsProfanity(cleaned)) {
    return { success: false, error: 'رسالتك فيها ألفاظ غير مسموح بيها' };
  }

  const since = new Date().toISOString();
  const { data, error } = await supabase
    .from('conversation_messages')
    .insert({ message_id: parsed.data.messageId, sender_role: role, content: cleaned })
    .select('id, message_id, sender_role, content, created_at')
    .maybeSingle();

  if (error) {
    // This was previously swallowed, which is why the cause was invisible.
    // Logging the full PostgrestError here (code/message/details/hint) is
    // what actually tells us whether this is an RLS with-check failure, a
    // check-constraint violation, or something else — the generic Arabic
    // message stays the same for the user, this only changes what shows up
    // in server logs.
    console.error('[sendConversationMessageAction] insert failed:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      role,
      messageId: parsed.data.messageId,
    });
    return { success: false, error: 'حدث خطأ أثناء إرسال الرسالة' };
  }

  if (!data) {
    // No Postgres error, but no row came back either — this shape means the
    // INSERT itself was accepted (WITH CHECK passed) but the immediate
    // re-select PostgREST does to return the row found nothing under the
    // table's SELECT policy. With the current policies this pair should
    // never disagree, so if this line ever fires it's the signal to compare
    // the INSERT and SELECT policies on conversation_messages directly.
    console.error('[sendConversationMessageAction] insert returned no error but no row', {
      role,
      messageId: parsed.data.messageId,
    });
    return { success: false, error: 'حدث خطأ أثناء إرسال الرسالة' };
  }

  // notify_on_conversation_message() (0025) already fired as a trigger on
  // the insert above — 'new_reply' when the owner just replied (notifies
  // the original anonymous sender), 'new_message' when the anonymous
  // sender replied back (notifies the owner). This forwards whichever one
  // it created to push.
  await dispatchPushForNewNotifications({
    since,
    types: ['new_reply', 'new_message'],
    payloadContains: { message_id: parsed.data.messageId },
  });

  revalidatePath(`/m/${parsed.data.messageId}`);
  return { success: true, message: data as ConversationMessage };
}
