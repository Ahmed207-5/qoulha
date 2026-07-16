-- New notification event types for the notifications system. Reuses the
-- existing 'reaction' and 'moderation' values for those two event types
-- (already fit exactly) rather than adding redundant new ones.

alter type notification_type add value if not exists 'new_reply';
alter type notification_type add value if not exists 'new_comment';
alter type notification_type add value if not exists 'new_repost';
alter type notification_type add value if not exists 'new_follower';
