/**
 * The @all admin-only broadcast mention (see 0028_admin_all_mention.sql).
 *
 * Reuses the exact same @username tokenization already used everywhere
 * else in the app (use-mention-input.ts, mention-text.tsx,
 * validations/message.ts, and every notify_on_*_mention() SQL trigger):
 * a mention is "@" followed by 2-30 word characters. "@all" is just the
 * one token that's reserved — whether it does anything still depends on
 * the author being an admin, checked wherever this is called from.
 */
const MENTION_TOKEN_PATTERN = /@([A-Za-z0-9_]{2,30})/g;

export function containsAllMention(content: string): boolean {
  const matches = content.match(MENTION_TOKEN_PATTERN);
  if (!matches) return false;
  return matches.some((token) => token.slice(1).toLowerCase() === 'all');
}
