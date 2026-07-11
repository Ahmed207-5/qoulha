import { getPlatformStats } from '@/services/admin-service';
import { StatCard } from '@/components/dashboard/stat-card';
import { Users, MessageSquare, Share2, Flag, UserPlus } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'لوحة الإدارة' };

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">لوحة الإدارة</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="إجمالي المستخدمين" value={stats.totalUsers} icon={Users} />
        <StatCard label="مستخدمين جدد اليوم" value={stats.newUsersToday} icon={UserPlus} />
        <StatCard label="إجمالي الرسائل" value={stats.totalMessages} icon={MessageSquare} />
        <StatCard label="منشورة على الحائط" value={stats.totalPublished} icon={Share2} />
        <StatCard label="بلاغات معلّقة" value={stats.pendingReports} icon={Flag} />
      </div>

      <div className="flex gap-3">
        <Link href="/admin/users" className="text-sm font-semibold text-brand-500 hover:underline">
          إدارة المستخدمين ←
        </Link>
        <Link href="/admin/reports" className="text-sm font-semibold text-brand-500 hover:underline">
          مراجعة البلاغات ←
        </Link>
        <Link href="/admin/logs" className="text-sm font-semibold text-brand-500 hover:underline">
          سجل النشاط ←
        </Link>
      </div>
    </div>
  );
}
