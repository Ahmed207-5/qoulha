'use client';

import * as React from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { FacebookIcon, WhatsAppIcon } from '@/components/shared/brand-icons';

// X/Telegram have no other user in the codebase yet, so they stay local;
// Facebook/WhatsApp are shared via brand-icons.tsx (same glyphs, used by
// the Follow Us section too) instead of being duplicated here.
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
