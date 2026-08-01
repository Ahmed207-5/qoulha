import { getActiveDailyPost, getArchivedDailyPosts } from '@/services/daily-space-service';
import { AdminDailySpaceManager } from '@/components/admin/admin-daily-space-manager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'إدارة مساحة اليوم' };

export default async function AdminDailySpacePage() {
  const [activePost, archive] = await Promise.all([getActiveDailyPost(), getArchivedDailyPosts(undefined, 10)]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">إدارة مساحة اليوم</h1>
      <p className="text-sm text-brand-700/70 dark:text-brand-200/70">
        منشور اليوم بيظهر لكل المستخدمين فوق الحائط العام. نشر منشور جديد بيأرشف المنشور الحالي أوتوماتيك.
      </p>
      <AdminDailySpaceManager initialActivePost={activePost} initialArchive={archive.posts} />
    </div>
  );
}
