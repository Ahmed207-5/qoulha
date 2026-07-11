export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      messages: {
        Row: {
          id: string;
          recipient_id: string;
          sender_fingerprint: string;
          sender_user_id: string | null;
          content: string;
          category: string;
          mood: string;
          is_read: boolean;
          is_favorited: boolean;
          is_published: boolean;
          published_at: string | null;
          is_flagged: boolean;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['messages']['Row']> & {
          recipient_id: string;
          content: string;
          sender_fingerprint: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Row']>;
      };
      reactions: {
        Row: {
          id: string;
          message_id: string;
          reactor_fingerprint: string;
          reactor_user_id: string | null;
          emoji: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['reactions']['Row']> & {
          message_id: string;
          reactor_fingerprint: string;
          emoji: string;
        };
        Update: Partial<Database['public']['Tables']['reactions']['Row']>;
      };
      reports: {
        Row: {
          id: string;
          message_id: string;
          reporter_id: string | null;
          reason: string;
          details: string | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['reports']['Row']> & { message_id: string; reason: string };
        Update: Partial<Database['public']['Tables']['reports']['Row']>;
      };
      visits: {
        Row: {
          id: string;
          profile_id: string;
          visitor_fingerprint: string;
          referrer: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['visits']['Row']> & {
          profile_id: string;
          visitor_fingerprint: string;
        };
        Update: Partial<Database['public']['Tables']['visits']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & { user_id: string; type: string };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      user_settings: {
        Row: {
          user_id: string;
          theme: string;
          allow_messages: boolean;
          email_notifications: boolean;
          require_captcha: boolean;
          blocked_categories: string[];
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_settings']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['user_settings']['Row']>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          metadata: Json;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['activity_logs']['Row']> & { action: string };
        Update: Partial<Database['public']['Tables']['activity_logs']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_visitor_count: {
        Args: { p_profile_id: string };
        Returns: void;
      };
    };
    Enums: {
      message_category: 'gratitude' | 'compliment' | 'advice' | 'confession' | 'apology' | 'opinion' | 'funny' | 'general';
      message_mood: 'happy' | 'sad' | 'thankful' | 'regret' | 'excited' | 'motivated' | 'calm';
      report_status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
      report_reason: 'harassment' | 'spam' | 'hate_speech' | 'sexual_content' | 'threat' | 'other';
      notification_type: 'new_message' | 'reaction' | 'system' | 'moderation';
    };
  };
}
