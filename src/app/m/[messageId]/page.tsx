import { getMessageDetail, getRepostsForMessage } from '@/services/message-detail-service';
import { getConversation } from '@/services/conversation-service';
import { getCommentsAction } from '@/actions/comments';
import { createClient } from '@/lib/supabase/server';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import { WallMessageCard } from '@/components/wall/wall-message-card';
import { RepostedByList } from '@/components/wall/reposted-by-list';
import { CommentList } from '@/components/message/comment-list';
import { ConversationThread } from '@/components/message/conversation-thread';
import { FloatingBackground } from '@/components/landing/floating-background';
import { Navbar } from '@/components/landing/navbar';
import { CATEGORY_META } from '@/constants/message';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ messageId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { messageId } = await params;
  const message = await getMessageDetail(messageId);
  if (!message) return { title: 'الرسالة غير موجودة' };

  const excerpt = message.content.length > 120 ? `${message.content.slice(0, 120)}…` : message.content;
  const title = `رسالة ${CATEGORY_META[message.category].label} إلى ${message.recipient.full_name} — قولها`;
  const messageUrl = `/m/${messageId}`;

  // Unpublished messages only ever render for their owner (RLS returns null
  // for anyone else, hence the notFound() above) — there's no one else to
  // share this URL with, so skip building full public share metadata for it
  // and keep it out of the index.
  if (!message.is_published) {
    return { title, description: excerpt, robots: { index: false, follow: false } };
  }

  return {
    title,
    description: excerpt,
    keywords: [CATEGORY_META[message.category].label, message.recipient.full_name, 'رسائل مجهولة', 'قولها'],
    alternates: { canonical: messageUrl },
    openGraph: {
      title,
      description: excerpt,
      url: messageUrl,
      images: message.recipient.avatar_url ? [message.recipient.avatar_url] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: excerpt,
      images: message.recipient.avatar_url ? [message.recipient.avatar_url] : undefined,
    },
  };
}

export default async function MessageDetailPage({ params }: Props) {
  const { messageId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    isAdmin = profile?.is_admin ?? false;
  }
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  const message = await getMessageDetail(messageId, user?.id);
  if (!message) notFound();

  const [initialComments, reposts, conversation] = await Promise.all([
    message.is_published ? getCommentsAction(messageId) : Promise.resolve({ comments: [], nextCursor: null }),
    message.is_published ? getRepostsForMessage(messageId) : Promise.resolve([]),
    getConversation(messageId, user?.id),
  ]);

  return (
    <>
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />
      <div className="mx-auto max-w-lg px-6 pb-16 pt-32">
        <WallMessageCard message={message} viewerId={user?.id} />

        {conversation.viewerRole && (
          <ConversationThread
            messageId={messageId}
            viewerRole={conversation.viewerRole}
            initialMessages={conversation.messages}
            initialOwnerCount={conversation.ownerMessageCount}
            initialAnonymousCount={conversation.anonymousMessageCount}
          />
        )}

        {message.is_published && (
          <>
            <RepostedByList messageId={messageId} initialReposts={reposts} isAdmin={isAdmin} />

            <div className="mt-8">
              <h2 className="mb-4 font-display text-lg font-bold text-brand-950 dark:text-white">التعليقات</h2>
              <CommentList
                messageId={messageId}
                initialComments={initialComments.comments}
                initialNextCursor={initialComments.nextCursor}
                currentUserId={user?.id}
                isAdmin={isAdmin}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
