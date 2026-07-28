// src/lib/profanity.ts

const BAD_WORDS = [
  "كلب",
  "حمار",
  "خول",
  "عرص",
  "وسخ",
  "شرموط",
  "قحبة",
  "زانية",
  "متناك",
  "كس",
  "زب",
  "نيك",
];

export function containsProfanity(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "") // إزالة التشكيل
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, "") // إزالة الرموز
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, "");

  return BAD_WORDS.some((word) => normalized.includes(word));
}