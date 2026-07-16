import Link from 'next/link';
import { Hash, TrendingUp } from 'lucide-react';
import { getTrendingTags } from '@/services/tags-service';

export async function TrendingTagsBar() {
  const tags = await getTrendingTags(10);
  if (tags.length === 0) return null;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
      <span className="flex items-center gap-1 text-xs font-semibold text-brand-500/70">
        <TrendingUp className="h-3.5 w-3.5" />
        ترند:
      </span>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tag/${tag.slug}`}
          className="flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-500/20 dark:text-brand-300"
        >
          <Hash className="h-3 w-3" />
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
