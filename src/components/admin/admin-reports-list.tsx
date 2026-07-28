'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { updateReportStatusAction, deleteReportedMessageAction, suspendUserAction } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-elements';
import { Search, Ban, CheckCircle2, EyeOff, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MessageCategory } from '@/types/domain';

const REASON_LABELS: Record<string, string> = {
  harassment: 'تحرش', spam: 'سبام', hate_speech: 'خطاب كراهية',
  sexual_content: 'محتوى جنسي', threat: 'تهديد', other: 'أخرى',
};

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'قيد الانتظار', color: '#E8A87C', icon: Clock },
  reviewed: { label: 'تمت المراجعة', color: '#5A9BD8', icon: ShieldCheck },
  actioned: { label: 'تم اتخاذ إجراء', color: '#C77B6F', icon: CheckCircle2 },
  dismissed: { label: 'متجاهَل', color: '#9CA3AF', icon: EyeOff },
};

export interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  message: {
    id: string;
    content: string;
    category: MessageCategory;
    recipient_id: string;
    recipient: { username: string; is_suspended: boolean } | { username: string; is_suspended: boolean }[] | null;
  } | null;
  reporter: { username: string } | null;
}

function getRecipient(message: ReportRow['message']) {
  if (!message?.recipient) return null;
  return Array.isArray(message.recipient) ? message.recipient[0] ?? null : message.recipient;
}

export function AdminReportsList({ initialReports }: { initialReports: ReportRow[] }) {
  const [reports, setReports] = React.useState(initialReports);
  const [search, setSearch] = React.useState('');
  const [reasonFilter, setReasonFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());

  function withPending<T>(reportId: string, fn: () => Promise<T>) {
    setPendingIds((prev) => new Set(prev).add(reportId));
    return fn().finally(() => {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    });
  }

  async function handleStatusChange(reportId: string, status: 'reviewed' | 'dismissed') {
    const prevReports = reports;
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    const result = await withPending(reportId, () => updateReportStatusAction(reportId, status));
    if (!result.success) {
      setReports(prevReports);
      toast.error(result.error ?? 'حدث خطأ');
    } else {
      toast.success(status === 'reviewed' ? 'اتعلّم إن البلاغ اتراجع' : 'تم تجاهل البلاغ');
    }
  }

  async function handleRemoveMessage(reportId: string, messageId: string) {
    const prevReports = reports;
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'actioned' } : r)));
    const result = await withPending(reportId, () => deleteReportedMessageAction(messageId, reportId));
    if (!result.success) {
      setReports(prevReports);
      toast.error(result.error ?? 'حدث خطأ');
    } else {
      toast.success('تم حذف الرسالة');
    }
  }

  async function handleBanPublisher(recipientId: string) {
    const result = await suspendUserAction(recipientId, true);
    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ');
      return;
    }
    toast.success('تم إيقاف الحساب');
    setReports((prev) =>
      prev.map((r) => {
        const recipient = getRecipient(r.message);
        if (r.message?.recipient_id === recipientId && recipient) {
          return { ...r, message: { ...r.message, recipient: { ...recipient, is_suspended: true } } };
        }
        return r;
      })
    );
  }

  const filteredReports = reports.filter((r) => {
    if (reasonFilter !== 'all' && r.reason !== reasonFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.message?.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          <Input
            placeholder="دور في محتوى الرسالة..."
            className="h-9 pr-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <select
          className="rounded-xl border border-brand-200/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]"
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
        >
          <option value="all">كل الأسباب</option>
          {Object.entries(REASON_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {filteredReports.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-sm text-brand-700/70">مفيش بلاغات مطابقة 🎉</div>
      ) : (
        filteredReports.map((report) => {
          const recipient = getRecipient(report.message);
          const statusMeta = STATUS_META[report.status] ?? STATUS_META.pending!;
          const StatusIcon = statusMeta.icon;
          const isPending = pendingIds.has(report.id);

          return (
            <div key={report.id} className="glass rounded-3xl p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </span>
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${statusMeta.color}20`, color: statusMeta.color }}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusMeta.label}
                  </span>
                </div>
                <span className="text-xs text-brand-500/60">
                  بلّغ عنه @{report.reporter?.username ?? 'مجهول'}
                </span>
              </div>

              {report.message && (
                <p className="rounded-2xl bg-brand-500/5 p-3 text-sm text-brand-900 dark:text-brand-50">
                  {report.message.content}
                </p>
              )}
              {report.details && (
                <p className="mt-2 text-xs text-brand-500/70">
                  <span className="font-semibold">تفاصيل البلاغ:</span> {report.details}
                </p>
              )}
              {recipient && (
                <p className="mt-2 text-xs text-brand-500/60">
                  ناشر الرسالة: @{recipient.username} {recipient.is_suspended && '(موقوف)'}
                </p>
              )}
              <p className="mt-2 text-[11px] text-brand-500/50">
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ar })}
              </p>

              <div className={cn('mt-3 flex flex-wrap gap-2', isPending && 'opacity-60')}>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => report.message && handleRemoveMessage(report.id, report.message.id)}
                >
                  حذف الرسالة
                </Button>
                {recipient && !recipient.is_suspended && (
                  <Button variant="destructive" size="sm" disabled={isPending} onClick={() => handleBanPublisher(report.message!.recipient_id)}>
                    <Ban className="h-3.5 w-3.5" />
                    إيقاف الناشر
                  </Button>
                )}
                <Button variant="secondary" size="sm" disabled={isPending} onClick={() => handleStatusChange(report.id, 'reviewed')}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  تمت المراجعة
                </Button>
                <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleStatusChange(report.id, 'dismissed')}>
                  تجاهل البلاغ
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
