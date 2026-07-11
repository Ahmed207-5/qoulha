import { Filter } from 'bad-words';

// Arabic-specific slurs/spam terms layered on top of the English base filter.
// Kept intentionally short and pattern-level; the goal is catching obvious
// abuse, not building an exhaustive blocklist (a longer list has diminishing
// returns and becomes a maintenance burden — pair this with user reports).
const ARABIC_BLOCKLIST: string[] = [
  'كسمك', 'ابن الكلب', 'يا كلب', 'يا حيوان', 'وسخ',
];

const filter = new Filter();

export function containsProfanity(text: string): boolean {
  if (filter.isProfane(text)) return true;
  const normalized = text.toLowerCase();
  return ARABIC_BLOCKLIST.some((word) => normalized.includes(word));
}

export function cleanForStorage(text: string): string {
  // Trim + collapse excessive whitespace/newlines used for spam padding
  return text.trim().replace(/\n{3,}/g, '\n\n').replace(/[ \t]{3,}/g, '  ');
}
