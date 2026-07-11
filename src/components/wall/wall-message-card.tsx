import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import { ReactionPicker } from './reaction-picker';
import { ShareButton } from './share-button';
import type { PublicWallMessage } from '@/types/domain';

export function WallMessageCard({ message }: { message: PublicWallMessage }) {
  const category = CATEGORY_META[message.category];
  const mood = MOOD_META[message.mood];
  const CategoryIcon = category.icon;
  const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/u/${message.recipient.username}`;

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

      <Link href={`/u/${message.recipient.username}`} className="mt-4 flex items-center gap-2">
        <div className="h-6 w-6 overflow-hidden rounded-full bg-brand-500/10">
          {message.recipient.avatar_url && (
            <Image src={message.recipient.avatar_url} alt="" width={24} height={24} className="h-full w-full object-cover" />
          )}
        </div>
        <span className="text-xs text-brand-500">إلى @{message.recipient.username}</span>
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <ReactionPicker messageId={message.id} initialCounts={message.reaction_counts} />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-brand-500/60">
            {message.published_at && formatDistanceToNow(new Date(message.published_at), { addSuffix: true, locale: ar })}
          </span>
          <ShareButton url={profileUrl} text={message.content} />
        </div>
      </div>
    </div>
  );
}
