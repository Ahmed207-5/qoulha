import {
  MessageCircleHeart, Heart, MessageCircle, Sparkles, Award, TrendingUp, Users, Eye, type LucideIcon,
} from 'lucide-react';

export const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  MessageCircleHeart,
  Heart,
  MessageCircle,
  Sparkles,
  Award,
  TrendingUp,
  Users,
  Eye,
};

export function getBadgeIcon(iconName: string): LucideIcon {
  return BADGE_ICON_MAP[iconName] ?? Award;
}
