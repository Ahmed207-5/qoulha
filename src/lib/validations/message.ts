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
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const reportMessageSchema = z.object({
  messageId: z.string().uuid(),
  reason: z.enum(['harassment', 'spam', 'hate_speech', 'sexual_content', 'threat', 'other']),
  details: z.string().max(500).optional(),
});

export type ReportMessageInput = z.infer<typeof reportMessageSchema>;
