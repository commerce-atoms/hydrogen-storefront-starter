import type {MetaDescriptor} from 'react-router';

import type {BrandConfig} from '~/config/brand';

/**
 * Build the *additive* set of meta descriptors derived from `brand.ts`.
 *
 * These are attached at the root route so every page inherits them. They are
 * intentionally limited to descriptors that are **safe to append** — nothing
 * a per-route meta function would want to override.
 *
 * In particular we do NOT emit a `<title>` here, because titles are per-page
 * and React Router does not dedupe duplicate `title` descriptors.
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
