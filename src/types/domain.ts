export type MessageCategory =
  | 'gratitude' | 'compliment' | 'advice' | 'confession'
  | 'apology' | 'opinion' | 'funny' | 'general';

export type MessageMood =
  | 'happy' | 'sad' | 'thankful' | 'regret' | 'excited' | 'motivated' | 'calm';

export type ReportReason = 'harassment' | 'spam' | 'hate_speech' | 'sexual_content' | 'threat' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
// Phase 1 (Notifications): 'new_reply' | 'new_comment' | 'new_repost' | 'new_follower'
// added to the existing set. 'reaction' and 'moderation' were already
// present and are reused as-is for those two event types.
export type NotificationType =
  | 'new_message' | 'reaction' | 'system' | 'moderation'
  | 'new_reply' | 'new_comment' | 'new_repost' | 'new_follower';
// Milestone 1: reaction set changed to the ASK.fm-style five below.
// Backed by the new message_reactions table (see 0007_message_reactions.sql),
// not the original anonymous `reactions` table.
export type ReactionEmoji = '❤️' | '😂' | '🥺' | '👏' | '🔥';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string | null;
  is_public: boolean;
  is_admin: boolean;
  is_suspended: boolean;
  message_count: number;
  visitor_count: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Milestone 1: the message owner's single official reply, shown directly
 * below the message wherever it's displayed (wall card, message detail
 * page, inbox).
 */
export interface Reply {
  id: string;
  message_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/** Milestone 1: a comment left by any authenticated user on a published message. */
export interface Comment {
  id: string;
  message_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>;
}

/**
 * The shape returned to a RECIPIENT reading their own inbox.
 * Intentionally has NO sender fields — this is what column-level
 * RLS grants enforce at the database layer, mirrored here in types
 * so a developer can't accidentally widen the client-facing shape.
 */
export interface InboxMessage {
  id: string;
  recipient_id: string;
  content: string;
  category: MessageCategory;
  mood: MessageMood;
  is_read: boolean;
  is_favorited: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  /** Milestone 1: the owner's own reply to this message, if they've posted one. */
  reply: Reply | null;
}

export interface PublicWallMessage extends InboxMessage {
  recipient: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>;
  reaction_counts: Record<ReactionEmoji, number>;
  /** Milestone 1 */
  comments_count: number;
  repost_count: number;
  my_reaction: ReactionEmoji | null;
  reposted_by_me: boolean;
  /** Phase 2 */
  tags: Tag[];
}

export interface DashboardStats {
  unread: number;
  totalRead: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  published: number;
  visitors: number;
  topCategory: MessageCategory | null;
  topMood: MessageMood | null;
}

// ---------- Phase 1: Notifications ----------

/**
 * Payload shapes per notification type. `new_message` carries no actor —
 * it's the one genuinely anonymous notification. Every other type is a
 * named, attributed social action (matches the "engagement is not
 * anonymous" principle established for comments/reactions/reposts).
 */
export interface NotificationPayload {
  message_id?: string;
  comment_id?: string;
  actor_id?: string;
  emoji?: ReactionEmoji;
  category?: MessageCategory;
  action?: 'deleted' | 'unpublished';
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: NotificationPayload;
  is_read: boolean;
  created_at: string;
  /** Joined in when payload.actor_id is present — the acting user's public info. */
  actor: Pick<Profile, 'username' | 'full_name' | 'avatar_url'> | null;
}

// ---------- Phase 1: Follow system ----------

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowProfileSummary extends Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> {
  followed_at: string;
}

// ---------- Phase 2: Tags ----------

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
}

// ---------- Phase 2: XP & Levels ----------

export type XpEventType =
  | 'message_sent' | 'reply_posted' | 'comment_posted'
  | 'reaction_received' | 'repost_received' | 'follower_gained' | 'profile_visited';

export type UserLevel = 'beginner' | 'active' | 'influencer' | 'legend';

export interface LevelInfo {
  level: UserLevel;
  label: string;
  currentXp: number;
  /** XP required to reach the CURRENT level's floor. */
  floorXp: number;
  /** XP required to reach the NEXT level, or null if already at the max level. */
  nextLevelXp: number | null;
  /** 0–100, how far through the current level the user is. */
  progressPercent: number;
}

// ---------- Phase 2: Badges ----------

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
}

export interface EarnedBadge extends Badge {
  earned_at: string;
}

// ---------- Phase 2: Confession of the Day ----------

export interface FeaturedMessage {
  id: string;
  message_id: string;
  featured_date: string;
}
