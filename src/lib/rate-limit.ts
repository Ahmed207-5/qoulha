import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const ratelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 messages per minute per fingerprint
      analytics: true,
      prefix: 'qoulha:send-message',
    })
  : null;

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (!ratelimit) {
    // No Redis configured (local dev) — fail open but log so it's visible.
    console.warn('[rate-limit] Upstash not configured; skipping rate limit check.');
    return { allowed: true };
  }

  const { success, reset } = await ratelimit.limit(identifier);
  if (!success) {
    return { allowed: false, retryAfterSeconds: Math.ceil((reset - Date.now()) / 1000) };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Milestone 1: separate limiters for comments/reactions/reposts, each with
// its own prefix so one feature's abuse doesn't exhaust another's budget.
// Kept independent of checkRateLimit() above rather than refactored into a
// shared helper, to avoid any risk of changing that function's behavior.
// ---------------------------------------------------------------------------

const commentRatelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 comments per minute per user
      analytics: true,
      prefix: 'qoulha:comment',
    })
  : null;

const reactionRatelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(30, '1 m'), // reactions are cheap, allow more
      analytics: true,
      prefix: 'qoulha:reaction',
    })
  : null;

const repostRatelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 reposts per minute per user
      analytics: true,
      prefix: 'qoulha:repost',
    })
  : null;

export async function checkCommentRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (!commentRatelimit) {
    console.warn('[rate-limit] Upstash not configured; skipping comment rate limit check.');
    return { allowed: true };
  }
  const { success, reset } = await commentRatelimit.limit(identifier);
  if (!success) return { allowed: false, retryAfterSeconds: Math.ceil((reset - Date.now()) / 1000) };
  return { allowed: true };
}

export async function checkReactionRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (!reactionRatelimit) {
    console.warn('[rate-limit] Upstash not configured; skipping reaction rate limit check.');
    return { allowed: true };
  }
  const { success, reset } = await reactionRatelimit.limit(identifier);
  if (!success) return { allowed: false, retryAfterSeconds: Math.ceil((reset - Date.now()) / 1000) };
  return { allowed: true };
}

export async function checkRepostRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (!repostRatelimit) {
    console.warn('[rate-limit] Upstash not configured; skipping repost rate limit check.');
    return { allowed: true };
  }
  const { success, reset } = await repostRatelimit.limit(identifier);
  if (!success) return { allowed: false, retryAfterSeconds: Math.ceil((reset - Date.now()) / 1000) };
  return { allowed: true };
}

const followRatelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 follow/unfollow actions per minute
      analytics: true,
      prefix: 'qoulha:follow',
    })
  : null;

export async function checkFollowRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (!followRatelimit) {
    console.warn('[rate-limit] Upstash not configured; skipping follow rate limit check.');
    return { allowed: true };
  }
  const { success, reset } = await followRatelimit.limit(identifier);
  if (!success) return { allowed: false, retryAfterSeconds: Math.ceil((reset - Date.now()) / 1000) };
  return { allowed: true };
}
