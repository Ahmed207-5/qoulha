export type MessageCategory =
  | 'gratitude' | 'compliment' | 'advice' | 'confession'
  | 'apology' | 'opinion' | 'funny' | 'general';

export type MessageMood =
  | 'happy' | 'sad' | 'thankful' | 'regret' | 'excited' | 'motivated' | 'calm';

export type ReportReason = 'harassment' | 'spam' | 'hate_speech' | 'sexual_content' | 'threat' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type NotificationType = 'new_message' | 'reaction' | 'system' | 'moderation';
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
