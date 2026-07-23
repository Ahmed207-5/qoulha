'use client';

import * as React from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateAvatarUrlAction } from '@/actions/settings';
import { toast } from 'sonner';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Uploads directly from the browser to the existing "avatars" Storage
 * bucket (0003_storage.sql — public read, owner-only write scoped to a
 * `{user_id}/...` folder), then saves the resulting public URL onto
 * profiles.avatar_url via a small dedicated server action. Kept separate
 * from ProfileSettingsForm's onboardingSchema-validated save so a picture
 * change never requires (or risks) touching username/bio.
 */
export function AvatarUploader({ userId, initialAvatarUrl }: { userId: string; initialAvatarUrl: string | null }) {
  const [avatarUrl, setAvatarUrl] = React.useState(initialAvatarUrl);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again later
    if (!file || uploading) return;

    const ext = EXT_BY_MIME[file.type];
    if (!ext) {
      toast.error('الصورة لازم تكون JPG أو PNG أو WebP');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('حجم الصورة أكبر من 2 ميجا');
      return;
    }

    setUploading(true);
    const supabase = createClient();
    // Unique filename per upload so the new avatar is never served from a
    // stale cached response at the old URL.
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setUploading(false);
      toast.error('حدث خطأ أثناء رفع الصورة');
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const result = await updateAvatarUrlAction(publicUrlData.publicUrl);
    setUploading(false);

    if (!result.success) {
      toast.error(result.error ?? 'حدث خطأ أثناء حفظ الصورة');
      return;
    }

    setAvatarUrl(publicUrlData.publicUrl);
    toast.success('تم تحديث الصورة الشخصية');
  }

  return (
    <div className="mb-5 flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-brand-500/10">
          {avatarUrl && (
            <Image src={avatarUrl} alt="" width={64} height={64} className="h-full w-full object-cover" />
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="تغيير الصورة الشخصية"
          className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
