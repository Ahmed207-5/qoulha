import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { CopyLinkButton } from './copy-link-button';
import { ProfileQrCode } from './profile-qr-code';
import { MessageCircleHeart, Send } from 'lucide-react';
import type { Profile } from '@/types/domain';

export function ProfileHeader({ profile, profileUrl }: { profile: Profile; profileUrl: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full ring-4 ring-brand-400/20">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.full_name} width={96} height={96} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white">
            {profile.full_name.charAt(0)}
          </div>
        )}
      </div>

      <h1 className="font-display text-xl font-bold text-brand-950 dark:text-white">{profile.full_name}</h1>
      <p className="text-sm text-brand-500" dir="ltr">@{profile.username}</p>

      {profile.bio && (
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-brand-700/80 dark:text-brand-200/80">
          {profile.bio}
        </p>
      )}

      <div className="mx-auto mt-5 flex items-center justify-center gap-2 text-xs text-brand-500/70">
        <MessageCircleHeart className="h-3.5 w-3.5" />
        {profile.message_count} رسالة وصلت
      </div>

      <Link href={`/u/${profile.username}/send`} className="mt-6 block">
        <Button size="lg" className="w-full">
          <Send className="h-4 w-4" />
          ابعتله رسالة
        </Button>
      </Link>

      <div className="mt-3 flex justify-center gap-2">
        <CopyLinkButton url={profileUrl} />
        <ProfileQrCode url={profileUrl} />
      </div>
    </Card>
  );
}
