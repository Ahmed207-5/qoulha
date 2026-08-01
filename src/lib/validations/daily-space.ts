import { z } from 'zod';
import { mentionCountRefinement, MENTION_COUNT_MESSAGE } from './message';
import { DAILY_REPLY_MAX_LENGTH } from '@/constants/daily-space';

export const dailyReplySchema = z.object({
  dailyPostId: z.string().uuid(),
  // Present only when replying to another user's top-level reply — the
  // one level of nesting Today's Space supports (see 0026_daily_space.sql).
  parentReplyId: z.string().uuid().optional(),
  content: z
    .string()
    .trim()
    .min(1, 'اكتب ردك الأول')
    .max(DAILY_REPLY_MAX_LENGTH, `الرد أطول من ${DAILY_REPLY_MAX_LENGTH} حرف`)
    .refine(mentionCountRefinement, `${MENTION_COUNT_MESSAGE} في الرد`),
});

export type DailyReplyInput = z.infer<typeof dailyReplySchema>;

// Admin-only: creating a new daily post.
export const createDailyPostSchema = z.object({
  type: z.enum(['question', 'discussion', 'poll', 'challenge', 'message']),
  title: z.string().trim().max(120, 'العنوان أطول من 120 حرف').optional(),
  content: z
    .string()
    .trim()
    .min(1, 'اكتب محتوى منشور اليوم')
    .max(1000, 'المحتوى أطول من 1000 حرف'),
});

export type CreateDailyPostInput = z.infer<typeof createDailyPostSchema>;
