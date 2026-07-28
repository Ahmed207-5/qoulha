import { SOCIAL_LINKS } from '@/constants/social-links';

export function FollowUs({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center gap-1.5 px-4 pb-3">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label}
            aria-label={link.label}
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-500/70 transition-colors hover:bg-brand-500/10 hover:text-brand-500"
          >
            <link.icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-700/80 transition-colors hover:bg-brand-500/5 dark:text-brand-200/80"
        >
          <link.icon className="h-4.5 w-4.5 text-brand-500" />
          {link.label}
        </a>
      ))}
    </div>
  );
}
