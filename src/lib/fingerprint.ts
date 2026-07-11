import { createHash } from 'crypto';

/**
 * Produces a one-way hash from request signals, used ONLY for rate limiting
 * and spam pattern detection. This value is what's stored in
 * messages.sender_fingerprint — it cannot be reversed to an IP or identity,
 * and it is never exposed to the recipient (see RLS column revoke).
 */
export function computeFingerprint(input: { ip: string; userAgent: string; userId?: string }): string {
  const raw = `${input.ip}|${input.userAgent}|${input.userId ?? 'anon'}|${process.env.FINGERPRINT_SALT ?? 'qoulha'}`;
  return createHash('sha256').update(raw).digest('hex');
}

export function getRequestIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? '0.0.0.0';
}
