'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getRandomMessageAction } from '@/actions/discover';
import { Shuffle } from 'lucide-react';
import { toast } from 'sonner';

export function RandomMessageButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    const messageId = await getRandomMessageAction();
    setLoading(false);

    if (!messageId) {
      toast.error('مفيش رسائل منشورة كفاية لسه');
      return;
    }
    router.push(`/m/${messageId}`);
  }

  return (
    <Button variant="secondary" onClick={handleClick} isLoading={loading}>
      <Shuffle className="h-4 w-4" />
      فاجئني برسالة
    </Button>
  );
}
