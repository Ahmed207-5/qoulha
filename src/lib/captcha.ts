const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Verifies a Cloudflare Turnstile token.
 *
 * Security note: captcha is only ever bypassed in development
 * (NODE_ENV === 'development'). In production, a missing secret key is
 * treated as a misconfiguration and FAILS CLOSED (rejects the message)
 * rather than silently allowing spam through — the previous "warn and
 * allow" fallback was only safe for local dev and has been split out.
 */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (isDevelopment) {
    console.warn('[captcha] NODE_ENV=development — bypassing Turnstile verification.');
    return true;
  }

  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error(
      '[captcha] TURNSTILE_SECRET_KEY is not set in a non-development environment. ' +
        'Rejecting message to avoid silently disabling spam protection in production.'
    );
    return false;
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });

  const data = await res.json();
  return data.success === true;
}
