import { getPublicProfileByUsername } from '@/services/profile-service';
import { SendMessageForm } from '@/components/message/send-message-form';
import { FloatingBackground } from '@/components/landing/floating-background';
import { Card } from '@/components/ui/form-elements';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  return { title: profile ? `ابعت رسالة لـ ${profile.full_name}` : 'الصفحة غير موجودة' };
}

export default async function SendMessagePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  if (!profile.allow_messages) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <FloatingBackground />
        <Card className="max-w-sm p-8 text-center">
          <p className="font-semibold text-brand-950 dark:text-white">
            {profile.full_name} مش بيستقبل رسائل دلوقتي
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <FloatingBackground />
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-brand-400/30">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
                {profile.full_name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-brand-950 dark:text-white">{profile.full_name}</p>
            <p className="text-xs text-brand-500" dir="ltr">@{profile.username}</p>
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <SendMessageForm recipientId={profile.id} />
        </Card>
      </div>
    </div>
  );
}
