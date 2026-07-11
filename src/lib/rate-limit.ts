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
