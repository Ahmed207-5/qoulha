/**
 * Site-wide WebSite structured data (schema.org). Rendered once, on the
 * homepage only — WebSite is a per-site entity, not a per-page one, so it
 * doesn't belong in the root layout (which renders on every route).
 *
 * Follows the same plain <script type="application/ld+json"> pattern as
 * the existing ProfileJsonLd component (src/components/shared/profile-json-ld.tsx).
 */
export function WebsiteJsonLd() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qoulha.vercel.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'قولها',
    url: base,
    inLanguage: 'ar',
    description:
      'قولها هي منصة الرسائل المجهولة العربية. اعمل صفحتك الشخصية، شارك رابطك، واستقبل رسائل صادقة من غير ما حد يعرف مين بعتها.',
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
