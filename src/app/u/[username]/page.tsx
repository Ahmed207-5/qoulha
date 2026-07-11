import { getPublicProfileByUsername, logProfileVisit } from '@/services/profile-service';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileJsonLd } from '@/components/shared/profile-json-ld';
import { FloatingBackground } from '@/components/landing/floating-background';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) return { title: 'الصفحة غير موجودة' };

  return {
    title: `${profile.full_name} (@${profile.username})`,
    description: profile.bio || `ابعت رسالة مجهولة لـ ${profile.full_name} على قولها`,
    openGraph: {
      title: `${profile.full_name} على قولها`,
      description: profile.bio || undefined,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  const headerList = await headers();
  const fingerprint = computeFingerprint({
    ip: getRequestIp(headerList),
    userAgent: headerList.get('user-agent') ?? 'unknown',
  });
  // Fire-and-forget — a slow analytics write should never block the page render
  void logProfileVisit(profile.id, fingerprint, headerList.get('referer'));

  const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/u/${profile.username}`;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <ProfileJsonLd profile={profile} url={profileUrl} />
      <FloatingBackground />
      <div className="w-full max-w-md">
        <ProfileHeader profile={profile} profileUrl={profileUrl} />
      </div>
    </div>
  );
}
