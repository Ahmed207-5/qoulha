import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import { ReactionPicker } from './reaction-picker';
import { ShareButton } from './share-button';
import { RepostButton } from './repost-button';
import { ReplyDisplay } from '@/components/message/reply-display';
import { TagList } from '@/components/message/tag-list';
import type { PublicWallMessage } from '@/types/domain';

export function WallMessageCard({
  message,
  viewerId,
}: {
  message: PublicWallMessage;
  /** Milestone 1: current viewer id, gates reactions/repost to authenticated users. */
  viewerId?: string;
}) {
  const category = CATEGORY_META[message.category];
  const mood = MOOD_META[message.mood];
  const CategoryIcon = category.icon;
  // Milestone 1: share now points at the message's own detail page (rich
  // OG metadata per message) instead of the recipient's profile page.
  const messageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/m/${message.id}`;

  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: `${category.color}20`, color: category.color }}
        >
          <CategoryIcon className="h-3 w-3" />
          {category.label}
        </span>
        <span className="text-xs text-brand-500/70">{mood.emoji} {mood.label}</span>
      </div>

      <p className="text-sm leading-relaxed text-brand-900 dark:text-brand-50">{message.content}</p>
      <TagList tags={message.tags} />

      {message.reply && <ReplyDisplay reply={message.reply} recipientName={message.recipient.full_name} />}

      <Link href={`/u/${message.recipient.username}`} className="mt-4 flex items-center gap-2">
        <div className="h-6 w-6 overflow-hidden rounded-full bg-brand-500/10">
          {message.recipient.avatar_url && (
            <Image src={message.recipient.avatar_url} alt="" width={24} height={24} className="h-full w-full object-cover" />
          )}
        </div>
        <span className="text-xs text-brand-500">إلى @{message.recipient.username}</span>
      </Link>

      {message.is_published ? (
        <div className="mt-4 flex items-center justify-between">
          <ReactionPicker
            messageId={message.id}
            initialCounts={message.reaction_counts}
            initialMyReaction={message.my_reaction}
            isAuthenticated={!!viewerId}
          />
          <div className="flex items-center gap-2">
            <Link href={`/m/${message.id}`} className="flex items-center gap-1 text-brand-500 hover:opacity-80">
              <MessageCircle className="h-4 w-4" />
              {message.comments_count > 0 && <span className="text-[11px]">{message.comments_count}</span>}
            </Link>
            <RepostButton
              messageId={message.id}
              initialCount={message.repost_count}
              initialReposted={message.reposted_by_me}
              isAuthenticated={!!viewerId}
            />
            <span className="text-[11px] text-brand-500/60">
              {message.published_at && formatDistanceToNow(new Date(message.published_at), { addSuffix: true, locale: ar })}
            </span>
            <ShareButton url={messageUrl} text={message.content} />
          </div>
        </div>
      ) : (
        // Not on the wall — reactions/comments/repost/share only apply to public wall
        // messages, and sharing a private link wouldn't resolve for anyone else anyway.
        <p className="mt-4 text-[11px] text-brand-500/60">رسالة خاصة — لسه متنشرتش على الحائط</p>
      )}
    </div>
  );
}
