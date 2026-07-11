'use client';

import * as React from 'react';
import { updateReportStatusAction, deleteReportedMessageAction } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { MessageCategory } from '@/types/domain';

const REASON_LABELS: Record<string, string> = {
  harassment: 'تحرش', spam: 'سبام', hate_speech: 'خطاب كراهية',
  sexual_content: 'محتوى جنسي', threat: 'تهديد', other: 'أخرى',
};

export interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  message: { id: string; content: string; category: MessageCategory } | null;
  reporter: { username: string } | null;
}

export function AdminReportsList({ initialReports }: { initialReports: ReportRow[] }) {
  const [reports, setReports] = React.useState(initialReports);

  async function handleDismiss(reportId: string) {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'dismissed' } : r)));
    const result = await updateReportStatusAction(reportId, 'dismissed');
    if (!result.success) toast.error('حدث خطأ');
  }

  async function handleRemoveMessage(reportId: string, messageId: string) {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'actioned' } : r)));
    const result = await deleteReportedMessageAction(messageId, reportId);
    if (!result.success) toast.error('حدث خطأ');
    else toast.success('تم حذف الرسالة');
  }

  if (reports.length === 0) {
    return <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70">مفيش بلاغات معلّقة 🎉</div>;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="glass rounded-3xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
            <span className="text-xs text-brand-500/60">
              بلّغ عنه @{report.reporter?.username ?? 'مجهول'}
            </span>
          </div>

          {report.message && (
            <p className="rounded-2xl bg-brand-500/5 p-3 text-sm text-brand-900 dark:text-brand-50">
              {report.message.content}
            </p>
          )}
          {report.details && <p className="mt-2 text-xs text-brand-500/70">تفاصيل: {report.details}</p>}

          {report.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => report.message && handleRemoveMessage(report.id, report.message.id)}>
                حذف الرسالة
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDismiss(report.id)}>
                تجاهل البلاغ
              </Button>
            </div>
          )}
          {report.status !== 'pending' && (
            <p className="mt-2 text-xs font-medium text-green-600">تم اتخاذ إجراء</p>
          )}
        </div>
      ))}
    </div>
  );
}
