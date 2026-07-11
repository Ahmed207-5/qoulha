import { createClient } from '@/lib/supabase/server';
import { InboxList } from '@/components/message/inbox-list';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الرسائل' };

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">صندوق الرسائل</h1>
      <InboxList userId={user.id} />
    </div>
  );
}
