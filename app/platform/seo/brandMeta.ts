import type {MetaDescriptor} from 'react-router';

import type {BrandConfig} from '~/config/brand';

/**
 * Additive site-wide meta descriptors derived from `brand.ts`.
 *
 * Appended to every page by `buildMetaTags`. Restricted to descriptors that
 * are safe to append — `<title>` is intentionally omitted because it is
 * per-page and React Router does not dedupe duplicate title descriptors.
 */
export function buildBrandMeta(brand: BrandConfig): MetaDescriptor[] {
  const tags: MetaDescriptor[] = [
    {property: 'og:site_name', content: brand.name},
    {property: 'og:locale', content: brand.defaultLocale.replace('-', '_')},
  ];

  const xHandle = getProfileHandle(brand.social.x);
  if (xHandle) {
    tags.push({name: 'twitter:site', content: `@${xHandle}`});
  }

  return tags;
}

function getProfileHandle(profileUrl: string | undefined): string | undefined {
  if (!profileUrl) return undefined;
  try {
    const [handle] = new URL(profileUrl).pathname.split('/').filter(Boolean);
    return handle?.replace(/^@/, '');
  } catch {
    return undefined;
  }
}
