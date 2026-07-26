'use server';

import { createClient } from '@/lib/supabase/server';
import type { ConversationMessage, ConversationSenderRole } from '@/types/domain';

export interface ConversationData {
  messages: ConversationMessage[];
  /** null if the viewer is neither the owner nor the original sender — the thread is private to them, so nothing is shown. */
  viewerRole: ConversationSenderRole | null;
  ownerMessageCount: number;
  anonymousMessageCount: number;
}

const EMPTY: ConversationData = { messages: [], viewerRole: null, ownerMessageCount: 0, anonymousMessageCount: 0 };

/**
 * Resolves the viewer's role in a message's conversation (owner, original
 * sender, or neither) and, if applicable, loads the thread. RLS
 * (0025_conversation_messages.sql) is the real enforcement point — this
 * just avoids querying at all for viewers who can't see anything, and
 * saves the page an extra round trip for the common "not a participant"
 * case (public wall viewers, other logged-in users, etc.).
 */
export async function getConversation(messageId: string, viewerId?: string): Promise<ConversationData> {
  if (!viewerId) return EMPTY;

  const supabase = await createClient();

  const { data: message } = await supabase.from('messages').select('recipient_id').eq('id', messageId).maybeSingle();
  if (!message) return EMPTY;

  let viewerRole: ConversationSenderRole | null = null;
  if (message.recipient_id === viewerId) {
    viewerRole = 'owner';
  } else {
    const { data: isSender } = await supabase.rpc('is_message_sender', { p_message_id: messageId });
    if (isSender) viewerRole = 'anonymous';
  }

  if (!viewerRole) return EMPTY;

  const { data } = await supabase
    .from('conversation_messages')
    .select('id, message_id, sender_role, content, created_at')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  const messages = (data ?? []) as ConversationMessage[];
  const ownerMessageCount = messages.filter((m) => m.sender_role === 'owner').length;
  const anonymousMessageCount = messages.filter((m) => m.sender_role === 'anonymous').length;

  return { messages, viewerRole, ownerMessageCount, anonymousMessageCount };
}
