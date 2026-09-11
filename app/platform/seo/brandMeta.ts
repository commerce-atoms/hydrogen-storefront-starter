import type {MetaDescriptor} from 'react-router';

import type {BrandConfig} from '~/config/brand';

/**
 * Additive site-wide meta descriptors derived from `brand.ts`.
 *
 * Emitted at the root route so every page inherits them. Restricted to
 * descriptors that are safe to append — `<title>` is intentionally omitted
 * because it is per-page and React Router does not dedupe duplicate title
 * descriptors.
 */
export function buildBrandMeta(brand: BrandConfig): MetaDescriptor[] {
  const tags: MetaDescriptor[] = [
    {property: 'og:site_name', content: brand.name},
    {property: 'og:locale', content: brand.defaultLocale.replace('-', '_')},
  ];

  const twitter = brand.social.twitter?.trim();
  if (twitter) {
    tags.push({name: 'twitter:site', content: `@${twitter.replace(/^@/, '')}`});
  }

  return tags;
}
