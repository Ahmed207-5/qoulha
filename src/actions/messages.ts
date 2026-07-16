'use server';

import { createClient } from '@/lib/supabase/server';
import { sendMessageSchema } from '@/lib/validations/message';
import { containsProfanity, cleanForStorage } from '@/lib/profanity-filter';
import { checkRateLimit } from '@/lib/rate-limit';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { verifyTurnstile } from '@/lib/captcha';
import { headers } from 'next/headers';
import type { ActionResult } from './auth';

export async function sendMessageAction(formData: unknown): Promise<ActionResult> {
  const parsed = sendMessageSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.')] = issue.message;
    return { success: false, fieldErrors };
  }

  const headerList = await headers();
  const ip = getRequestIp(headerList);
  const userAgent = headerList.get('user-agent') ?? 'unknown';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fingerprint = computeFingerprint({ ip, userAgent, userId: user?.id });

  // 1. Captcha — first line of defense against automated abuse
  const captchaOk = await verifyTurnstile(parsed.data.captchaToken, ip);
  if (!captchaOk) {
    return { success: false, error: 'فشل التحقق من أنك لست روبوت، حاول تاني' };
  }

  // 2. Rate limit by fingerprint, not by user id, so logged-out senders are covered too
  const rateLimitResult = await checkRateLimit(fingerprint);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: `بعتت رسايل كتير على السريع، جرّب تاني بعد ${rateLimitResult.retryAfterSeconds} ثانية`,
    };
  }

  // 3. Profanity / spam filter — content that trips this is flagged, not silently dropped,
  //    so recipients can still review it and report if needed (avoids false-positive censorship)
  const cleaned = cleanForStorage(parsed.data.content);
  const flagged = containsProfanity(cleaned);

  // Generate the id ourselves rather than using .select() to read it back —
  // requesting RETURNING data on this INSERT breaks anonymous sending
  // entirely (Postgres requires the new row to satisfy a SELECT policy
  // when RETURNING is requested; an unpublished message sent by someone
  // who isn't its recipient satisfies none, verified directly). Since the
  // messages.id column has no default we depend on, supplying our own
  // UUID is simplest and sidesteps the issue completely.
  const messageId = crypto.randomUUID();

  const { error } = await supabase.from('messages').insert({
    id: messageId,
    recipient_id: parsed.data.recipientId,
    content: cleaned,
    category: parsed.data.category,
    mood: parsed.data.mood,
    sender_fingerprint: fingerprint,
    sender_user_id: user?.id ?? null,
    is_flagged: flagged,
  });

  if (error) {
    return { success: false, error: 'حدث خطأ أثناء إرسال الرسالة، حاول مرة أخرى' };
  }

  if (parsed.data.tags && parsed.data.tags.length > 0) {
    // Best-effort — tags are a nice-to-have; a failure here must never
    // undo or fail the message send itself.
    await supabase.rpc('attach_tags_to_message', {
      p_message_id: messageId,
      p_tag_names: parsed.data.tags,
    });
  }

  return { success: true };
}
