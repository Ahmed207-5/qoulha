import { getDailyFeatureAction } from '@/actions/discover';
import { getMessageDetail } from '@/services/message-detail-service';
import { WallMessageCard } from '@/components/wall/wall-message-card';
import { Sparkles } from 'lucide-react';

export async function ConfessionOfTheDay({ viewerId }: { viewerId?: string }) {
  const messageId = await getDailyFeatureAction();
  if (!messageId) return null;

  const message = await getMessageDetail(messageId, viewerId);
  if (!message) return null;

  return (
    <div className="mx-auto mb-10 max-w-lg">
      <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-500">
        <Sparkles className="h-4 w-4" />
        اعتراف اليوم
      </div>
      <div className="rounded-[2rem] bg-gradient-to-br from-brand-400/20 via-brand-500/10 to-transparent p-1">
        <WallMessageCard message={message} viewerId={viewerId} />
      </div>
    </div>
  );
}
