'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <AlertCircle className="mb-4 h-14 w-14 text-red-400" />
          <h1 className="font-display text-2xl font-extrabold text-brand-950">حصل خطأ غير متوقع</h1>
          <p className="mt-2 text-brand-700/80">حاول تاني، ولو استمرت المشكلة كلمنا</p>
          <Button className="mt-6" onClick={reset}>حاول تاني</Button>
        </div>
      </body>
    </html>
  );
}
