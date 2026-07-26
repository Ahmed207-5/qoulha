import { getMessageDetail, getRepostsForMessage } from '@/services/message-detail-service';
import { getCommentsAction } from '@/actions/comments';
import { createClient } from '@/lib/supabase/server';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import { WallMessageCard } from '@/components/wall/wall-message-card';
import { RepostedByList } from '@/components/wall/reposted-by-list';
import { CommentList } from '@/components/message/comment-list';
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

  return {
    title,
    description: excerpt,
    openGraph: {
      title,
      description: excerpt,
      images: message.recipient.avatar_url ? [message.recipient.avatar_url] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: excerpt,
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

  const [initialComments, reposts] = message.is_published
    ? await Promise.all([getCommentsAction(messageId), getRepostsForMessage(messageId)])
    : [{ comments: [], nextCursor: null }, []];

  return (
    <>
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />
      <div className="mx-auto max-w-lg px-6 pb-16 pt-32">
        <WallMessageCard message={message} viewerId={user?.id} />

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
