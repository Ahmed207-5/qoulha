import { z } from 'zod';

export const MESSAGE_MAX_LENGTH = 500;

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
    .max(MESSAGE_MAX_LENGTH, `الرسالة أطول من ${MESSAGE_MAX_LENGTH} حرف`),
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
  details: z.string().max(500).optional(),
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
    .refine((val) => (val.match(/@[A-Za-z0-9_]{2,30}/g) ?? []).length <= 5, 'أقصى حاجة 5 إشارات (@) في التعليق'),
});

export type CommentInput = z.infer<typeof commentSchema>;

export const replySchema = z.object({
  messageId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, 'اكتب ردك الأول')
    .max(MESSAGE_MAX_LENGTH, `الرد أطول من ${MESSAGE_MAX_LENGTH} حرف`),
});

export type ReplyInput = z.infer<typeof replySchema>;
