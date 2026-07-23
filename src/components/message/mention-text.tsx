import Link from 'next/link';

const MENTION_SPLIT = /(@[A-Za-z0-9_]{2,30})/g;
const MENTION_MATCH = /^@[A-Za-z0-9_]{2,30}$/;

/**
 * Splits comment content on @username tokens and renders each as a link to
 * /u/[username]. No server round-trip / existence check here on purpose —
 * that page already resolves gracefully if the username doesn't exist, and
 * checking here would mean an extra query per comment render. Whether a
 * mention actually notified anyone is decided server-side at write time
 * (see notify_on_mention() in 0021_comment_mentions.sql); this is purely
 * display.
 */
export function MentionText({ content }: { content: string }) {
  const parts = content.split(MENTION_SPLIT);

  return (
    <>
      {parts.map((part, i) =>
        MENTION_MATCH.test(part) ? (
          <Link
            key={i}
            href={`/u/${part.slice(1)}`}
            className="font-semibold text-brand-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
