'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Send, MessagesSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { sendConversationMessageAction } from '@/actions/conversation';
import { MAX_CONVERSATION_MESSAGES_PER_SIDE, CONVERSATION_LIMIT_REACHED_TEXT } from '@/constants/message';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ConversationMessage, ConversationSenderRole } from '@/types/domain';

/**
 * The private conversation thread between the message owner and the
 * original anonymous sender. Only ever rendered for one of those two
 * viewers (see getConversation() in conversation-service.ts) — anyone
 * else, including public wall visitors, never sees this at all.
 *
 * The original anonymous message itself stays pinned above this
 * component (rendered separately by WallMessageCard on the message
 * detail page) — everything here is the back-and-forth that follows it.
 */
export function ConversationThread({
  messageId,
  viewerRole,
  initialMessages,
  initialOwnerCount,
  initialAnonymousCount,
}: {
  messageId: string;
  viewerRole: ConversationSenderRole;
  initialMessages: ConversationMessage[];
  initialOwnerCount: number;
  initialAnonymousCount: number;
}) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [ownerCount, setOwnerCount] = React.useState(initialOwnerCount);
  const [anonymousCount, setAnonymousCount] = React.useState(initialAnonymousCount);
  const [content, setContent] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const myCount = viewerRole === 'owner' ? ownerCount : anonymousCount;
  const limitReached = myCount >= MAX_CONVERSATION_MESSAGES_PER_SIDE;

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || limitReached) return;

    setSending(true);
    const result = await sendConversationMessageAction({ messageId, content: trimmed });
    setSending(false);

    if (!result.success || !result.message) {
      toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'حدث خطأ');
      return;
    }

    setMessages((prev) => [...prev, result.message!]);
    if (viewerRole === 'owner') setOwnerCount((c) => c + 1);
    else setAnonymousCount((c) => c + 1);
    setContent('');
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-bold text-brand-950 dark:text-white">
        <MessagesSquare className="h-4.5 w-4.5" />
        المحادثة
      </h2>

      <div className="glass rounded-3xl p-4">
        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto p-1">
          {messages.length === 0 && (
            <p className="py-6 text-center text-sm text-brand-500/60">لسه مفيش رسائل في المحادثة دي</p>
          )}

          {messages.map((m) => (
            <div key={m.id} dir="ltr" className={cn('flex', m.sender_role === 'owner' ? 'justify-end' : 'justify-start')}>
              <div
                dir="auto"
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                  m.sender_role === 'owner'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-200 text-gray-900 dark:bg-white/10 dark:text-brand-50'
                )}
              >
                <p>{m.content}</p>
                <p
                  className={cn(
                    'mt-1 text-[10px]',
                    m.sender_role === 'owner' ? 'text-white/70' : 'text-gray-500 dark:text-brand-300/60'
                  )}
                >
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ar })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 border-t border-brand-200/40 pt-3 dark:border-white/10">
          {limitReached ? (
            <p className="rounded-xl bg-brand-500/5 px-3.5 py-2.5 text-center text-xs font-semibold text-brand-600 dark:text-brand-300">
              {CONVERSATION_LIMIT_REACHED_TEXT}
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <Textarea
                rows={1}
                maxLength={500}
                placeholder="اكتب رسالتك..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-11"
              />
              <Button size="icon" onClick={handleSend} isLoading={sending} disabled={!content.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-brand-500/60">{myCount}/{MAX_CONVERSATION_MESSAGES_PER_SIDE}</p>
        </div>
      </div>
    </div>
  );
}
