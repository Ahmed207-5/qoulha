import * as React from 'react';

const MENTION_COUNT_PATTERN = /@[A-Za-z0-9_]{2,30}/g;
// Matches an in-progress @query right at the cursor — requires the '@' to
// start a word (start of text or preceded by whitespace) so "email@x" etc.
// never triggers the dropdown.
const ACTIVE_MENTION_PATTERN = /(?:^|\s)@([A-Za-z0-9_]{0,30})$/;
const MAX_MENTIONS = 5;

/**
 * Powers @mention autocomplete for any textarea-backed text field —
 * originally built for comments (0021_comment_mentions.sql), reused as-is
 * for private messages so both stay in lock-step with one implementation.
 * Deliberately agnostic to how `value` is stored (plain useState in
 * CommentForm, react-hook-form's watch/setValue in SendMessageForm).
 */
export function useMentionInput(value: string, setValue: (next: string) => void) {
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [mentionStart, setMentionStart] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  function updateMentionState(text: string, cursor: number) {
    const alreadyMentioned = text.match(MENTION_COUNT_PATTERN)?.length ?? 0;
    const match = text.slice(0, cursor).match(ACTIVE_MENTION_PATTERN);
    if (match && alreadyMentioned < MAX_MENTIONS) {
      const partialUsername = match[1] ?? '';
      setMentionQuery(partialUsername);
      setMentionStart(cursor - partialUsername.length - 1);
    } else {
      setMentionQuery(null);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    updateMentionState(e.target.value, e.target.selectionStart ?? e.target.value.length);
  }

  function handleSelectMention(username: string) {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const inserted = `@${username} `;
    const nextValue = value.slice(0, mentionStart) + inserted + value.slice(cursor);
    setValue(nextValue);
    setMentionQuery(null);

    const nextCursor = mentionStart + inserted.length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleCursorMove(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    updateMentionState(value, e.currentTarget.selectionStart ?? value.length);
  }

  function closeMentionDropdown() {
    setMentionQuery(null);
  }

  return {
    textareaRef,
    mentionQuery,
    handleChange,
    handleSelectMention,
    handleCursorMove,
    closeMentionDropdown,
  };
}
