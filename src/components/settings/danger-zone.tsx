'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportMessagesAction, deleteAccountAction } from '@/actions/settings';
import { Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function DangerZone() {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const result = await exportMessagesAction();
    setExporting(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob([result.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qoulha-messages.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteAccountAction();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-brand-500/5 p-4">
        <div>
          <p className="text-sm font-medium text-brand-950 dark:text-white">تصدير رسائلك</p>
          <p className="text-xs text-brand-500/70">حمّل نسخة من كل رسائلك بصيغة JSON</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport} isLoading={exporting}>
          <Download className="h-4 w-4" />
          تصدير
        </Button>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-semibold">حذف الحساب نهائيًا</p>
        </div>
        <p className="mt-1 text-xs text-brand-700/70 dark:text-brand-200/70">
          هذا الإجراء لا يمكن التراجع عنه — هيتم حذف صفحتك وكل رسائلك للأبد.
        </p>
        {confirmingDelete ? (
          <div className="mt-3 flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} isLoading={deleting}>
              أيوه، احذف حسابي
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              إلغاء
            </Button>
          </div>
        ) : (
          <Button variant="destructive" size="sm" className="mt-3" onClick={() => setConfirmingDelete(true)}>
            حذف الحساب
          </Button>
        )}
      </div>
    </div>
  );
}
