'use client';

import * as React from 'react';
import { Flag } from 'lucide-react';
import { ReportDialog } from './report-dialog';

export function ReportButton({ messageId, className }: { messageId: string; className?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="إبلاغ عن الرسالة"
        aria-label="إبلاغ عن الرسالة"
        className={className ?? 'rounded-full p-1.5 text-brand-400 hover:bg-red-500/10 hover:text-red-500'}
      >
        <Flag className="h-4 w-4" />
      </button>
      {open && <ReportDialog messageId={messageId} onClose={() => setOpen(false)} />}
    </>
  );
}
