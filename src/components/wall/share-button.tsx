'use client';

import * as React from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

// Simplified inline brand glyphs (same approach as GoogleIcon in
// google-signin-button.tsx) — no external icon package dependency.
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.3 14.1c-.22.63-1.28 1.2-1.77 1.24-.45.04-.9.2-3.06-.64-2.59-1.02-4.26-3.68-4.39-3.86-.13-.18-1.05-1.4-1.05-2.67 0-1.27.67-1.89.9-2.15.22-.26.5-.32.66-.32.17 0 .33 0 .48.01.15.01.36-.06.56.43.22.53.73 1.83.8 1.96.06.13.1.28.02.46-.09.18-.13.29-.26.44-.13.15-.27.34-.39.46-.13.13-.26.27-.11.53.15.26.68 1.12 1.46 1.82 1 .9 1.85 1.18 2.11 1.31.26.13.41.11.56-.07.15-.17.63-.73.8-.98.17-.26.34-.21.56-.13.22.09 1.42.67 1.67.79.24.13.4.19.46.29.06.11.06.61-.16 1.2z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.9h2.54V9.86c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2h3.3l-7.2 8.2L23.5 22h-6.6l-5.2-6.8L5.7 22H2.4l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.4 3.9H5.5z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3 2.9 11.6c-1.2.5-1.2 1.2-.2 1.5l4.9 1.5 1.9 5.8c.2.6.4.9.9.9.4 0 .6-.2.9-.5l2.1-2 4.3 3.2c.8.4 1.3.2 1.5-.7l2.8-13.2c.3-1.1-.4-1.6-1.1-1.3zM8.9 13.9l9.3-5.9c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.3z" />
    </svg>
  );
}

/**
 * Milestone 1: expanded from a native-share/copy-link button into an
 * explicit platform menu (WhatsApp, Facebook, X, Telegram, Copy Link), per
 * spec. Reuses the same dropdown pattern as the "⋮" menu in message-card.tsx
 * (glass-strong, absolute, rounded-2xl) for visual consistency.
 */
export function ShareButton({ url, text }: { url: string; text: string }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const links = [
    { label: 'واتساب', Icon: WhatsAppIcon, href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { label: 'فيسبوك', Icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'X', Icon: XIcon, href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { label: 'تيليجرام', Icon: TelegramIcon, href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
  ];

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('اتنسخ الرابط');
    setOpen(false);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="rounded-full p-1.5 text-brand-500 hover:bg-brand-500/10">
        <Share2 className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="glass-strong absolute left-0 top-9 z-20 w-44 overflow-hidden rounded-2xl py-1 text-sm">
            {links.map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-right hover:bg-brand-500/5"
              >
                <Icon />
                {label}
              </a>
            ))}
            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-2 px-4 py-2 text-right hover:bg-brand-500/5"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              نسخ الرابط
            </button>
          </div>
        </>
      )}
    </div>
  );
}
