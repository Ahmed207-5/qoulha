import type { Profile } from '@/types/domain';

export function ProfileJsonLd({ profile, url }: { profile: Profile; url: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateCreated: profile.created_at,
    dateModified: profile.updated_at,
    mainEntity: {
      '@type': 'Person',
      name: profile.full_name,
      alternateName: profile.username,
      description: profile.bio || undefined,
      image: profile.avatar_url || undefined,
      url,
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
