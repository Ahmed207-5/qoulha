import { getTagBySlug } from '@/services/tags-service';
import { WallGrid } from '@/components/wall/wall-grid';
import { Navbar } from '@/components/landing/navbar';
import { FloatingBackground } from '@/components/landing/floating-background';
import { createClient } from '@/lib/supabase/server';
import { getUnreadNotificationCount } from '@/services/notifications-service';
import { Hash } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: 'التاج غير موجود' };
  return {
    title: `#${tag.name}`,
    description: `رسائل بتاج #${tag.name} على قولها`,
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <>
      <FloatingBackground />
      <Navbar userId={user?.id} initialUnreadCount={unreadCount} />
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
            <Hash className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-brand-950 dark:text-white">#{tag.name}</h1>
          <p className="mt-2 text-brand-700/80 dark:text-brand-200/80">{tag.usage_count} رسالة بالتاج ده</p>
        </div>
        <WallGrid viewerId={user?.id} tagSlug={slug} hideSearch />
      </div>
    </>
  );
}
