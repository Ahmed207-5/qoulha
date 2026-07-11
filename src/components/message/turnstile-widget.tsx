'use client';

import Script from 'next/script';
import { useEffect, useId, useRef } from 'react';
import { ShieldOff } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

// Inlined by Next.js at build time — safe to branch on in client components.
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Renders the Cloudflare Turnstile widget in production.
 *
 * In development this is disabled completely: the widget never mounts and
 * never loads the Cloudflare script, so local message-sending works without
 * any captcha keys configured. The actual enforcement still lives
 * server-side in verifyTurnstile() (src/lib/captcha.ts), which independently
 * bypasses only when NODE_ENV === 'development' and fails closed in any
 * other environment — this component skipping itself is a dev convenience,
 * not a security boundary.
 */
export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerId = useId().replace(/:/g, '');
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (isDevelopment) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    const render = () => {
      if (!window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(`#${containerId}`, {
        sitekey: siteKey,
        callback: onVerify,
        theme: 'auto',
      });
    };

    if (window.turnstile) render();
    else document.addEventListener('turnstile-loaded', render);

    return () => document.removeEventListener('turnstile-loaded', render);
  }, [containerId, onVerify]);

  if (isDevelopment) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-brand-500/60">
        <ShieldOff className="h-3.5 w-3.5" />
        وضع التطوير: التحقق من الكابتشا متعطل محليًا
      </p>
    );
  }

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return (
      <p className="text-xs font-medium text-orange-500">
        NEXT_PUBLIC_TURNSTILE_SITE_KEY غير مضبوط — الكابتشا مطلوبة في الإنتاج
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => document.dispatchEvent(new Event('turnstile-loaded'))}
      />
      <div id={containerId} />
    </>
  );
}
