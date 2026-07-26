import type { MessageCategory, MessageMood, ReactionEmoji } from '@/types/domain';
import {
  Heart, Sparkles, Lightbulb, Lock, HandHeart, MessageCircle, Laugh, MessagesSquare,
} from 'lucide-react';

export const CATEGORY_META: Record<MessageCategory, { label: string; icon: typeof Heart; color: string }> = {
  gratitude:  { label: 'امتنان',  icon: HandHeart,      color: '#E8A87C' },
  compliment: { label: 'مجاملة',  icon: Sparkles,       color: '#D4A5A5' },
  advice:     { label: 'نصيحة',   icon: Lightbulb,      color: '#7FB3B0' },
  confession: { label: 'اعتراف',  icon: Lock,           color: '#8B7BA8' },
  apology:    { label: 'اعتذار',  icon: Heart,          color: '#C77B6F' },
  opinion:    { label: 'رأي',     icon: MessageCircle,  color: '#6B9B8F' },
  funny:      { label: 'مضحك',    icon: Laugh,          color: '#E8C168' },
  general:    { label: 'عام',     icon: MessagesSquare, color: '#9CA3AF' },
};

export const MOOD_META: Record<MessageMood, { label: string; emoji: string }> = {
  happy:      { label: 'سعيد',   emoji: '😊' },
  sad:        { label: 'حزين',   emoji: '😢' },
  thankful:   { label: 'ممتن',   emoji: '🙏' },
  regret:     { label: 'نادم',   emoji: '😔' },
  excited:    { label: 'متحمس',  emoji: '🤩' },
  motivated:  { label: 'متحفز',  emoji: '💪' },
  calm:       { label: 'هادئ',   emoji: '😌' },
};

// Milestone 1: five reactions backed by message_reactions (see domain.ts)
export const REACTION_EMOJIS: ReactionEmoji[] = ['❤️', '😂', '🥺', '👏', '🔥'];

export const ANONYMITY_NOTICE = 'لن نظهر هويتك للشخص المستقبل.';
