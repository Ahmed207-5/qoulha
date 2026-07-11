import { getActivityLogs } from '@/services/admin-service';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'سجل النشاط' };

const ACTION_LABELS: Record<string, string> = {
  login: 'تسجيل دخول', logout: 'تسجيل خروج', message_sent: 'إرسال رسالة',
  message_deleted: 'حذف رسالة', message_published: 'نشر رسالة', message_unpublished: 'إلغاء نشر رسالة',
  profile_updated: 'تحديث الملف الشخصي', settings_updated: 'تحديث الإعدادات',
  report_filed: 'إبلاغ', report_actioned: 'إجراء إداري', account_deleted: 'حذف حساب',
};

interface ActivityLogRow {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user: { username: string } | null;
}

export default async function AdminLogsPage() {
  const { logs } = await getActivityLogs(0, 50);
  const typedLogs = logs as unknown as ActivityLogRow[];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">سجل النشاط</h1>

      <div className="glass divide-y divide-brand-200/20 rounded-3xl dark:divide-white/5">
        {typedLogs.length === 0 && <p className="p-6 text-center text-sm text-brand-500/70">مفيش نشاط مسجّل لسه</p>}
        {typedLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <span className="font-medium text-brand-950 dark:text-white">
                {ACTION_LABELS[log.action] ?? log.action}
              </span>
              {log.user?.username && (
                <span className="text-brand-500"> — @{log.user.username}</span>
              )}
            </div>
            <span className="text-xs text-brand-500/60">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
