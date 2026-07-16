import { Card } from '@/components/ui/form-elements';
import type { ProfileLinkAnalytics } from '@/services/profile-link-analytics-service';
import { Eye, Users, QrCode, Share2 } from 'lucide-react';

const PERIOD_LABELS = { today: 'النهاردة', thisWeek: 'الأسبوع', thisMonth: 'الشهر', allTime: 'كل الأوقات' } as const;

function AnalyticsRow({ icon: Icon, label, summary }: { icon: typeof Eye; label: string; summary: ProfileLinkAnalytics['visits'] }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
        <Icon className="h-4 w-4 text-brand-500" />
      </div>
      <span className="w-28 shrink-0 text-sm font-medium text-brand-950 dark:text-white">{label}</span>
      <div className="grid flex-1 grid-cols-4 gap-2 text-center">
        {(Object.keys(PERIOD_LABELS) as (keyof typeof PERIOD_LABELS)[]).map((key) => (
          <div key={key}>
            <p className="font-display text-sm font-bold text-brand-950 dark:text-white">{summary[key]}</p>
            <p className="text-[10px] text-brand-500/60">{PERIOD_LABELS[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileLinkAnalyticsCard({ analytics }: { analytics: ProfileLinkAnalytics }) {
  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-brand-950 dark:text-white">إحصائيات رابط صفحتك</h3>
        <span className="text-xs text-brand-500/60">{analytics.messagesReceivedAllTime} رسالة من خلال الرابط</span>
      </div>
      <div className="divide-y divide-brand-200/10 dark:divide-white/5">
        <AnalyticsRow icon={Eye} label="الزيارات" summary={analytics.visits} />
        <AnalyticsRow icon={Users} label="زوار فريدين" summary={analytics.uniqueVisitors} />
        <AnalyticsRow icon={QrCode} label="مسح QR" summary={analytics.qrScans} />
        <AnalyticsRow icon={Share2} label="فتح من مشاركة" summary={analytics.shareOpens} />
      </div>
    </Card>
  );
}
