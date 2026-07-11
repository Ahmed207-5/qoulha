import { getReportsList } from '@/services/admin-service';
import { AdminReportsList, type ReportRow } from '@/components/admin/admin-reports-list';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'البلاغات' };

export default async function AdminReportsPage() {
  const reports = await getReportsList('pending');

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">البلاغات</h1>
      <AdminReportsList initialReports={reports as unknown as ReportRow[]} />
    </div>
  );
}
