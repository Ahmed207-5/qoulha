import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qoulha.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/inbox', '/settings', '/analytics', '/admin', '/onboarding', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
