'use client';

import * as React from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, MessageCircleHeart } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '@/types/domain';

// Same simplified WhatsApp glyph used in share-button.tsx.
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.3 14.1c-.22.63-1.28 1.2-1.77 1.24-.45.04-.9.2-3.06-.64-2.59-1.02-4.26-3.68-4.39-3.86-.13-.18-1.05-1.4-1.05-2.67 0-1.27.67-1.89.9-2.15.22-.26.5-.32.66-.32.17 0 .33 0 .48.01.15.01.36-.06.56.43.22.53.73 1.83.8 1.96.06.13.1.28.02.46-.09.18-.13.29-.26.44-.13.15-.27.34-.39.46-.13.13-.26.27-.11.53.15.26.68 1.12 1.46 1.82 1 .9 1.85 1.18 2.11 1.31.26.13.41.11.56-.07.15-.17.63-.73.8-.98.17-.26.34-.21.56-.13.22.09 1.42.67 1.67.79.24.13.4.19.46.29.06.11.06.61-.16 1.2z" />
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

export function ProfileShareCard({ profile, profileUrl }: { profile: Profile; profileUrl: string }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = React.useState(false);

  const inviteText = `💜 ابعتلي رسالة مجهولة على قولها!\n${profileUrl}?src=whatsapp`;

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `qoulha-${profile.username}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الصورة');
    }
    setDownloading(false);
  }

  function handleWhatsAppInvite() {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank', 'noopener,noreferrer');
  }

  function handleTelegramInvite() {
    const url = `${profileUrl}?src=telegram`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('💜 ابعتلي رسالة مجهولة على قولها!')}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function handleFacebookInvite() {
    const url = `${profileUrl}?src=facebook`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  }

  function handleXInvite() {
    const url = `${profileUrl}?src=x`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent('💜 ابعتلي رسالة مجهولة على قولها!')}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <div>
      <div
        ref={cardRef}
        className="mx-auto flex w-full max-w-xs flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-center text-white"
      >
        <MessageCircleHeart className="h-8 w-8" />
        <div className="h-20 w-20 overflow-hidden rounded-full ring-4 ring-white/30">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/20 text-2xl font-bold">
              {profile.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="font-display text-lg font-bold">{profile.full_name}</p>
          <p className="text-sm text-white/80" dir="ltr">@{profile.username}</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <QRCodeSVG value={`${profileUrl}?src=qr`} size={140} />
        </div>
        <p className="text-sm font-semibold">ابعتلي رسالة مجهولة 💜</p>
        <p className="text-xs text-white/70" dir="ltr">{profileUrl}</p>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleDownload} isLoading={downloading}>
          <Download className="h-4 w-4" />
          تحميل PNG
        </Button>
        <Button variant="secondary" size="sm" onClick={handleWhatsAppInvite}>
          <WhatsAppIcon />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleTelegramInvite}>
          <TelegramIcon />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleFacebookInvite}>
          <FacebookIcon />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleXInvite}>
          <XIcon />
        </Button>
      </div>
    </div>
  );
}