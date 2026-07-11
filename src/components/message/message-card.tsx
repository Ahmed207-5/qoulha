'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Heart, Share2, Trash2, Flag, MoreVertical } from 'lucide-react';
import { CATEGORY_META, MOOD_META } from '@/constants/message';
import type { InboxMessage } from '@/types/domain';
import { cn } from '@/lib/utils';
import { toggleFavoriteAction, togglePublishAction, deleteMessageAction, markMessageReadAction } from '@/actions/message-mutations';
import { toast } from 'sonner';
import { ReportDialog } from './report-dialog';

export function MessageCard({ message, onDeleted }: { message: InboxMessage; onDeleted?: (id: string) => void }) {
  const [msg, setMsg] = React.useState(message);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const category = CATEGORY_META[msg.category];
  const mood = MOOD_META[msg.mood];
  const CategoryIcon = category.icon;

  React.useEffect(() => {
    if (!msg.is_read) {
      markMessageReadAction(msg.id);
      setMsg((m) => ({ ...m, is_read: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFavorite() {
    const next = !msg.is_favorited;
    setMsg((m) => ({ ...m, is_favorited: next }));
    const result = await toggleFavoriteAction(msg.id, next);
    if (!result.success) {
      setMsg((m) => ({ ...m, is_favorited: !next }));
      toast.error('حدث خطأ');
    }
  }

  async function handlePublish() {
    const next = !msg.is_published;
    setMsg((m) => ({ ...m, is_published: next }));
    const result = await togglePublishAction(msg.id, next);
    if (!result.success) {
      setMsg((m) => ({ ...m, is_published: !next }));
      toast.error('حدث خطأ');
    } else {
      toast.success(next ? 'اتنشرت على الحائط العام' : 'اتشالت من الحائط العام');
    }
    setMenuOpen(false);
  }

  async function handleDelete() {
    setDeleted(true);
    const result = await deleteMessageAction(msg.id);
    if (!result.success) {
      setDeleted(false);
      toast.error('حدث خطأ');
    } else {
      onDeleted?.(msg.id);
    }
  }

  if (deleted) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn('glass relative rounded-3xl p-5', !msg.is_read && 'ring-2 ring-brand-400/40')}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            <CategoryIcon className="h-3 w-3" />
            {category.label}
          </span>
          <span className="text-xs text-brand-500/70">{mood.emoji} {mood.label}</span>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="rounded-full p-1.5 hover:bg-brand-500/10">
            <MoreVertical className="h-4 w-4 text-brand-500" />
          </button>
          {menuOpen && (
            <div className="glass-strong absolute left-0 top-9 z-10 w-40 overflow-hidden rounded-2xl py-1 text-sm">
              <button
                onClick={handlePublish}
                className="flex w-full items-center gap-2 px-4 py-2 text-right hover:bg-brand-500/5"
              >
                <Share2 className="h-3.5 w-3.5" />
                {msg.is_published ? 'شيل من الحائط' : 'انشر على الحائط'}
              </button>
              <button
                onClick={() => { setReportOpen(true); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-right hover:bg-brand-500/5"
              >
                <Flag className="h-3.5 w-3.5" />
                إبلاغ
              </button>
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-4 py-2 text-right text-red-500 hover:bg-red-500/5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-brand-900 dark:text-brand-50">{msg.content}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-brand-500/60">
          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ar })}
        </span>
        <button onClick={handleFavorite} className="rounded-full p-1.5 hover:bg-red-500/10">
          <Heart className={cn('h-4 w-4', msg.is_favorited ? 'fill-red-500 text-red-500' : 'text-brand-400')} />
        </button>
      </div>

      {reportOpen && <ReportDialog messageId={msg.id} onClose={() => setReportOpen(false)} />}
    </motion.div>
  );
}
