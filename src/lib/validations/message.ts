import { z } from 'zod';

export const MESSAGE_MAX_LENGTH = 500;

// Shared with commentSchema below (and, via export, with any other text
// field that supports @mentions — e.g. dailyReplySchema in
// validations/daily-space.ts) — @mentions are capped at 5 everywhere per
// this one rule, instead of re-deriving it per feature.
const MAX_MENTIONS_PER_TEXT = 5;
export const mentionCountRefinement = (val: string) =>
  (val.match(/@[A-Za-z0-9_]{2,30}/g) ?? []).length <= MAX_MENTIONS_PER_TEXT;
export const MENTION_COUNT_MESSAGE = `أقصى حاجة ${MAX_MENTIONS_PER_TEXT} إشارات (@)`;

// Only development skips the client-side requirement that a token be
// present — production always requires a real Turnstile token, and the
// server-side verifyTurnstile() check (src/lib/captcha.ts) is the actual
// enforcement point regardless of what the client sends.
const isDevelopment = process.env.NODE_ENV === 'development';

export const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, 'اكتب رسالتك أولاً')
    .max(MESSAGE_MAX_LENGTH, `الرسالة أطول من ${MESSAGE_MAX_LENGTH} حرف`)
    .refine(mentionCountRefinement, `${MENTION_COUNT_MESSAGE} في الرسالة`),
  category: z.enum([
    'gratitude', 'compliment', 'advice', 'confession',
    'apology', 'opinion', 'funny', 'general',
  ]),
  mood: z.enum(['happy', 'sad', 'thankful', 'regret', 'excited', 'motivated', 'calm']),
  captchaToken: isDevelopment
    ? z.string().default('dev-bypass')
    : z.string().min(1, 'برجاء تأكيد أنك لست روبوت'),
  tags: z.array(z.string().trim().min(1).max(30)).max(3, 'أقصى حاجة 3 تاجات').optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const reportMessageSchema = z.object({
  messageId: z.string().uuid(),
  reason: z.enum(['harassment', 'spam', 'hate_speech', 'sexual_content', 'threat', 'other']),
  details: z
    .string()
    .trim()
    .min(10, 'اكتب تفاصيل أكتر (10 أحرف على الأقل)')
    .max(500, 'التفاصيل أطول من 500 حرف'),
});

export type ReportMessageInput = z.infer<typeof reportMessageSchema>;

// Milestone 1: comments and replies

export const commentSchema = z.object({
  messageId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, 'اكتب تعليق الأول')
    .max(300, 'التعليق أطول من 300 حرف')
    .refine(mentionCountRefinement, `${MENTION_COUNT_MESSAGE} في التعليق`),
});

export type CommentInput = z.infer<typeof commentSchema>;

// Milestone 2: lightweight anonymous conversation (replaces replySchema)

export const conversationMessageSchema = z.object({
  messageId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, 'اكتب رسالتك الأول')
    .max(MESSAGE_MAX_LENGTH, `الرسالة أطول من ${MESSAGE_MAX_LENGTH} حرف`),
});

export type ConversationMessageInput = z.infer<typeof conversationMessageSchema>;
