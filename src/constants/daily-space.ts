import type { DailyPostType } from '@/types/domain';
import { HelpCircle, MessagesSquare, BarChart3, Swords, Megaphone } from 'lucide-react';

/** Visual identity for each daily post type — icon + color, same shape as CATEGORY_META in message.ts. */
export const DAILY_POST_TYPE_META: Record<DailyPostType, { label: string; icon: typeof HelpCircle; color: string }> = {
  question: { label: 'سؤال اليوم', icon: HelpCircle, color: '#5A9BD8' },
  discussion: { label: 'نقاش اليوم', icon: MessagesSquare, color: '#7FB3B0' },
  poll: { label: 'استطلاع اليوم', icon: BarChart3, color: '#E8A87C' },
  challenge: { label: 'تحدي اليوم', icon: Swords, color: '#C77B6F' },
  message: { label: 'رسالة اليوم', icon: Megaphone, color: '#8567c4' },
};

export const DAILY_POST_TYPE_OPTIONS: { value: DailyPostType; label: string }[] = (
  Object.entries(DAILY_POST_TYPE_META) as [DailyPostType, { label: string }][]
).map(([value, meta]) => ({ value, label: meta.label }));

export const DAILY_REPLY_MAX_LENGTH = 500;
