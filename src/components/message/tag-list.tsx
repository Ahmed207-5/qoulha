import Link from 'next/link';
import { Hash } from 'lucide-react';
import type { Tag } from '@/types/domain';

export function TagList({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tag/${tag.slug}`}
          className="flex items-center gap-0.5 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-600 hover:bg-brand-500/20 dark:text-brand-300"
        >
          <Hash className="h-2.5 w-2.5" />
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
