import { getPublicProfileByUsername, logProfileVisit } from '@/services/profile-service';
import { getFollowStats } from '@/services/follow-service';
import { getProfileStats } from '@/services/profile-activity-service';
import { getUserLevelInfo, getAllBadgesWithEarnedState } from '@/services/gamification-service';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import { createClient } from '@/lib/supabase/server';
import { ProfileHeader } from '@/components/profile/profile-header';
import { LevelProgress } from '@/components/profile/level-progress';
import { BadgesGrid } from '@/components/profile/badges-grid';
import { ProfileShareCard } from '@/components/profile/profile-share-card';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { ProfileJsonLd } from '@/components/shared/profile-json-ld';
import { FloatingBackground } from '@/components/landing/floating-background';
import { Navbar } from '@/components/landing/navbar';
import { Card } from '@/components/ui/form-elements';
import { computeFingerprint, getRequestIp } from '@/lib/fingerprint';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MessageCircle, Heart, Repeat2, CalendarDays } from 'lucide-react';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ src?: string }>;
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

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { src } = await searchParams;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerList = await headers();
  const fingerprint = computeFingerprint({
    ip: getRequestIp(headerList),
    userAgent: headerList.get('user-agent') ?? 'unknown',
  });
  const VALID_SOURCES = ['direct', 'qr', 'share', 'whatsapp', 'telegram', 'facebook', 'x'] as const;
  const source = VALID_SOURCES.includes(src as (typeof VALID_SOURCES)[number])
    ? (src as (typeof VALID_SOURCES)[number])
    : 'direct';
  // Fire-and-forget — a slow analytics write should never block the page render
  void logProfileVisit(profile.id, fingerprint, headerList.get('referer'), source);

  const [followStats, profileStats, levelInfo, badges, unreadCount] = await Promise.all([
    getFollowStats(profile.id, user?.id),
    getProfileStats(profile.id),
    getUserLevelInfo(profile.id),
    getAllBadgesWithEarnedState(profile.id),
    user ? getUnreadNotificationCount(user.id) : Promise.resolve(0),
  ]);

  const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/u/${profile.username}`;
  const isOwnProfile = user?.id === profile.id;

  return (
    <>
      <ProfileJsonLd profile={profile} url={profileUrl} />
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />

      <div className="mx-auto max-w-2xl px-6 pb-16 pt-32">
        <ProfileHeader
          profile={profile}
          profileUrl={profileUrl}
          followStats={followStats}
          isAuthenticated={!!user}
          isOwnProfile={isOwnProfile}
        />

        <Card className="mt-4 p-6">
          <LevelProgress levelInfo={levelInfo} />
          <BadgesGrid badges={badges} />

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-brand-200/20 pt-5 text-center dark:border-white/10 sm:grid-cols-4">
            <div>
              <p className="flex items-center justify-center gap-1 text-brand-500">
                <MessageCircle className="h-3.5 w-3.5" />
              </p>
              <p className="mt-1 font-display text-lg font-bold text-brand-950 dark:text-white">{profileStats.totalCommentsPosted}</p>
              <p className="text-[11px] text-brand-500/60">تعليقات كتبها</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-brand-500">
                <Heart className="h-3.5 w-3.5" />
              </p>
              <p className="mt-1 font-display text-lg font-bold text-brand-950 dark:text-white">{profileStats.totalReactionsReceived}</p>
              <p className="text-[11px] text-brand-500/60">تفاعل استقبله</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-brand-500">
                <Repeat2 className="h-3.5 w-3.5" />
              </p>
              <p className="mt-1 font-display text-lg font-bold text-brand-950 dark:text-white">{profileStats.totalRepostsReceived}</p>
              <p className="text-[11px] text-brand-500/60">ريبوست استقبله</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-brand-500">
                <CalendarDays className="h-3.5 w-3.5" />
              </p>
              <p className="mt-1 text-xs font-semibold text-brand-950 dark:text-white">
                {formatDistanceToNow(new Date(profileStats.joinDate), { addSuffix: true, locale: ar })}
              </p>
              <p className="text-[11px] text-brand-500/60">انضم قولها</p>
            </div>
          </div>
        </Card>

        {isOwnProfile && (
          <Card className="mt-4 p-6">
            <h2 className="mb-4 text-center font-display text-sm font-bold text-brand-950 dark:text-white">
              شارك صفحتك
            </h2>
            <ProfileShareCard profile={profile} profileUrl={profileUrl} />
          </Card>
        )}

        <ProfileTabs profileId={profile.id} viewerId={user?.id} />
      </div>
    </>
  );
}
