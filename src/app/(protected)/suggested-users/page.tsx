import { createClient } from '@/lib/supabase/server';
import { getSuggestedUsers } from '@/services/suggested-users-service';
import { SuggestedUsersPageClient } from '@/components/discover/suggested-users-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'قد تعرفهم',
  description: 'اكتشف أشخاصًا جدد قد ترغب في متابعتهم على قولها',
};

export default async function SuggestedUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initialUsers = user ? await getSuggestedUsers([], 10) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">✨ قد تعرفهم</h1>
        <p className="mt-1 text-sm text-brand-700/80 dark:text-brand-200/80">
          اكتشف أشخاصًا جدد قد ترغب في متابعتهم.
        </p>
      </div>
      <SuggestedUsersPageClient initialUsers={initialUsers} />
    </div>
  );
}
