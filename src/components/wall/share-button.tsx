'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShareButton({ url, text }: { url: string; text: string }) {
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, text });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('اتنسخ الرابط');
    }
  }

  return (
    <button onClick={handleShare} className="rounded-full p-1.5 text-brand-500 hover:bg-brand-500/10">
      <Share2 className="h-4 w-4" />
    </button>
  );
}
