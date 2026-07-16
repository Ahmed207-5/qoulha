import type { NotificationType } from '@/types/domain';
import { MessageCircleHeart, MessageCircle, Heart, Repeat2, UserPlus, ShieldAlert, CornerUpLeft, Bell } from 'lucide-react';

export const NOTIFICATION_META: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  new_message:  { icon: MessageCircleHeart, color: '#6b4bab' },
  new_reply:    { icon: CornerUpLeft,       color: '#7FB3B0' },
  new_comment:  { icon: MessageCircle,      color: '#8567c4' },
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
