import type { NotificationType } from '@/types/domain';
import { MessageCircleHeart, MessageCircle, Heart, Repeat2, UserPlus, ShieldAlert, CornerUpLeft, AtSign, Bell, CalendarDays, Sparkles, Megaphone } from 'lucide-react';

export const NOTIFICATION_META: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  new_message:  { icon: MessageCircleHeart, color: '#6b4bab' },
  new_reply:    { icon: CornerUpLeft,       color: '#7FB3B0' },
  new_comment:  { icon: MessageCircle,      color: '#8567c4' },
  mention:      { icon: AtSign,             color: '#5A9BD8' },
  daily_space_mention: { icon: CalendarDays, color: '#5A9BD8' },
  daily_space_published: { icon: Sparkles,  color: '#6b4bab' },
  admin_broadcast: { icon: Megaphone,       color: '#6b4bab' },
  reaction:     { icon: Heart,              color: '#C77B6F' },
  new_repost:   { icon: Repeat2,            color: '#6B9B8F' },
  new_follower: { icon: UserPlus,           color: '#E8A87C' },
  moderation:   { icon: ShieldAlert,        color: '#E05252' },
  system:       { icon: Bell,               color: '#9CA3AF' },
};

/** Builds the human-readable Arabic sentence for a notification, given the actor's name where relevant. */
export function getNotificationText(type: NotificationType, actorName?: string): string {
  switch (type) {
    case 'new_message':
      return 'وصلتك رسالة مجهولة جديدة';
    case 'new_reply':
      return 'حد رد على الرسالة اللي بعتها';
    case 'new_comment':
      return actorName ? `${actorName} علّق على رسالتك` : 'حد علّق على رسالتك';
    case 'mention':
      return actorName ? `${actorName} عملك إشارة في تعليق 👀` : 'حد عملك إشارة في تعليق 👀';
    case 'daily_space_mention':
      return actorName ? `${actorName} عملك إشارة في مساحة اليوم 👀` : 'حد عملك إشارة في مساحة اليوم 👀';
    case 'daily_space_published':
      return '💜 مساحة جديدة وصلت! شارك في سؤال أو نقاش اليوم';
    case 'admin_broadcast':
      // Exact copy as specified for the @all admin broadcast — kept as
      // two lines (rendered via `whitespace-pre-line` in NotificationItem).
      return '💜 إعلان جديد من Qoulha\nافتح وشوف الجديد.';
    case 'reaction':
      return actorName ? `${actorName} تفاعل مع رسالتك` : 'حد تفاعل مع رسالتك';
    case 'new_repost':
      return actorName ? `${actorName} عمل ريبوست لرسالتك` : 'حد عمل ريبوست لرسالتك';
    case 'new_follower':
      return actorName ? `${actorName} بدأ يتابعك` : 'حد جديد بدأ يتابعك';
    case 'moderation':
      return 'فريق الإشراف اتخذ إجراء على إحدى رسائلك';
    case 'system':
    default:
      return 'إشعار جديد';
  }
}
