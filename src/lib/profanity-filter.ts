import { Filter } from 'bad-words';

// Arabic-specific slurs/spam terms layered on top of the English base filter.
// Kept intentionally short and pattern-level; the goal is catching obvious
// abuse, not building an exhaustive blocklist (a longer list has diminishing
// returns and becomes a maintenance burden — pair this with user reports).
const ARABIC_BLOCKLIST: string[] = [
  // سباب عام
  'كلب',
  'حمار',
  'حيوان',
  'عرص',
  'خول',
  'وسخ',
  'قذر',
  'زبالة',
  'غبي',
  'اهبل',
  'حقير',
  'نجس',
  'معفن',

  // شتائم مركبة
  'ابن الكلب',
  'ابن الوسخه',
  'ابن الوسخة',
  'يا كلب',
  'يا عرص',
  'يا خول',
  'يا حيوان',

  // ألفاظ جنسية
  'كسم',
  'كسمك',
  'كس',
  'زب',
  'نيك',
  'متناك',
  'شرموط',
  'شرموطه',
  'شرموطة',
  'قحبه',
  'قحبة',
  'زاني',
  'زانية',
];

const filter = new Filter();

export function containsProfanity(text: string): boolean {
  if (filter.isProfane(text)) return true;

  const normalized = text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, ""); // إزالة جميع المسافات

  return ARABIC_BLOCKLIST.some((word) =>
    normalized.includes(word.replace(/\s+/g, ""))
  );
}

export function cleanForStorage(text: string): string {
  // Trim + collapse excessive whitespace/newlines used for spam padding
  return text.trim().replace(/\n{3,}/g, '\n\n').replace(/[ \t]{3,}/g, '  ');
}
